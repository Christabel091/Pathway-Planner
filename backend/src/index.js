import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { PrismaClient, Prisma } from "@prisma/client";
import notificationsRouter from "./routes/notifications.js";
import cliniciansRouter from "./routes/clinicians.js";
import authRoutes from "./routes/auth.js";
import infoRouter from "./routes/info.js";
import patientRouter from "./routes/patients.js";
import regenerateCodeRouter from "./routes/regenerateCode.js";
import createAdminRouter from "./routes/admin.js";

const prisma = new PrismaClient();
const app = express();
//middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/onboarding", infoRouter);
app.use("/patients", patientRouter);
app.use("/regenerate", regenerateCodeRouter);
app.use("/clinicians", cliniciansRouter);
app.use("/notifications", notificationsRouter);

const server = createServer(app);
const wss = new WebSocketServer({ server });

const socketsByUser = new Map();
function heartbeat() {
  this.isAlive = true;
}
// index.js

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const { type } = msg || {};

    if (type === "SESSION_JOIN") {
      const key = String(msg.userId); // normalize
      ws.userId = key;
      ws.deviceId = msg.deviceId || "";
      if (!socketsByUser.has(key)) socketsByUser.set(key, new Set());
      socketsByUser.get(key).add(ws);
      console.log("WS SESSION_JOIN:", {
        key,
        size: socketsByUser.get(key).size,
      });
      return;
    }

    if (type === "notif:ack") {
      const { notificationId } = msg;
      try {
        await prisma.notification.update({
          where: { id: Number(notificationId) },
          data: { delivered_at: new Date() },
        });
      } catch {}
      return;
    }

    if (type === "lab:read") {
      const { labId } = msg;
      try {
        await prisma.labResult.update({
          where: { id: Number(labId) },
          data: { read_at: new Date() },
        });
      } catch {}
      return;
    }
  });

  ws.on("close", () => {
    if (ws.userId && socketsByUser.has(ws.userId)) {
      socketsByUser.get(ws.userId).delete(ws);
      if (socketsByUser.get(ws.userId).size === 0)
        socketsByUser.delete(ws.userId);
    }
  });
});

function emitToUser(userId, payload) {
  const key = String(userId);
  const set = socketsByUser.get(key);
  const count = set
    ? [...set].filter((s) => s.readyState === s.OPEN).length
    : 0;
  console.log("emitToUser:", {
    key,
    sockets: count,
    payloadType: payload?.type,
  });
  if (!set) return 0;
  let sent = 0;
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
      sent++;
    }
  }
  return sent;
}
const adminRouter = createAdminRouter(prisma, emitToUser);
app.use("/admin", adminRouter);
// map patient_id -> user_id
async function getPatientUserId(patientId) {
  const p = await prisma.patient.findUnique({
    where: { id: Number(patientId) },
    select: { user_id: true },
  });
  return p?.user_id ?? null;
}
//create lab result for patient and send in real time
app.post("/labs", async (req, res) => {
  try {
    const { patientId, lab_type, lab_value, unit, source, file_url } =
      req.body || {};
    if (!patientId || !lab_type) {
      return res
        .status(400)
        .json({ error: "patientId and lab_type are required" });
    }

    const lab = await prisma.labResult.create({
      data: {
        patient_id: Number(patientId),
        lab_type,
        lab_value: lab_value != null ? new Prisma.Decimal(lab_value) : null,
        unit: unit ?? null,
        source: source ?? null,
        file_url: file_url ?? null,
      },
    });

    const patientUserId = await getPatientUserId(patientId);
    if (patientUserId) {
      const notif = await prisma.notification.create({
        data: {
          user_id: patientUserId,
          type: "LAB_NEW",
          entity: "lab_result",
          entity_id: lab.id,
          payload: {
            labId: lab.id,
            lab_type: lab.lab_type,
            unit: lab.unit,
            file_url: lab.file_url,
            created_at: lab.created_at,
          },
        },
      });

      emitToUser(patientUserId, {
        type: "LAB_NEW",
        payload: {
          notificationId: notif.id,
          labId: lab.id,
          title: lab.lab_type,
          testType: lab.lab_type,
          resultAt: lab.created_at,
        },
      });
    }

    return res.status(201).json({ labId: lab.id });
  } catch (e) {
    console.error("POST /labs error", e);
    return res.status(500).json({ error: "Failed to create lab" });
  }
});

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`✅ HTTP+WS on http://localhost:${PORT}`);
});
