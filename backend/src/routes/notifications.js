import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient, Gender, BloodType } from "@prisma/client";

const prisma = new PrismaClient();
const notificationsRouter = express.Router();
notificationsRouter.get("/main/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  const rows = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });
  res.json(rows);
});

// Fallback: GET /notifications/:userId
notificationsRouter.get("/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ error: "bad userId" });
  const rows = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });
  res.json(rows);
});

// PATCH /notifications/:id/read
notificationsRouter.patch("/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "bad id" });
  const out = await prisma.notification.update({
    where: { id },
    data: { read_at: new Date() },
  });
  res.json({ ok: true, id: out.id, read_at: out.read_at });
});

export default notificationsRouter;
