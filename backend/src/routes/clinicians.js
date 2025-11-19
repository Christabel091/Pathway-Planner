// routes/clinicians.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import generateInviteCode from "./regenerateCode.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /clinicians/by-user/:userId
 * Resolve clinician by linked users.id, return profile + inviteCode.
 */
router.get("/by-user/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  const clinician = await prisma.clinician.findUnique({
    where: { user_id: userId },
    select: {
      id: true,
      user_id: true,
      full_name: true,
      specialty: true,
      license_number: true,
      clinic_name: true,
      contact_email: true,
      contact_phone: true,
      office_address: true,
      inviteCode: true,
      inviteUpdatedAt: true,
    },
  });

  if (!clinician) return res.status(404).json({ error: "Clinician not found" });
  return res.json({ clinician });
});

// GET /clinicians/account/:id
// id = user_id from users table
router.get("/account/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  try {
    const clinician = await prisma.clinician.findUnique({
      where: { user_id: id },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        specialty: true,
        license_number: true,
        clinic_name: true,
        contact_email: true,
        contact_phone: true,
        office_address: true,
      },
    });

    if (!clinician) {
      return res.status(404).json({ error: "Clinician record not found." });
    }

    return res.json(clinician);
  } catch (err) {
    console.error("GET /clinicians/account/:id error:", err);
    return res.status(500).json({ error: "Failed to load clinician account." });
  }
});

router.put("/account/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  try {
    const {
      specialty,
      clinic_name,
      contact_email,
      contact_phone,
      office_address,
    } = req.body;

    const data = {};
    if (typeof specialty !== "undefined") data.specialty = specialty;
    if (typeof clinic_name !== "undefined") data.clinic_name = clinic_name;
    if (typeof contact_email !== "undefined")
      data.contact_email = contact_email;
    if (typeof contact_phone !== "undefined")
      data.contact_phone = contact_phone;
    if (typeof office_address !== "undefined")
      data.office_address = office_address;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No editable fields provided.",
      });
    }

    const updated = await prisma.clinician.update({
      where: { user_id: id },
      data,
      select: {
        id: true,
        user_id: true,
        full_name: true,
        specialty: true,
        license_number: true,
        clinic_name: true,
        contact_email: true,
        contact_phone: true,
        office_address: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PUT /clinicians/account/:id error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Clinician record not found." });
    }
    return res
      .status(500)
      .json({ error: "Failed to update clinician account." });
  }
});

router.get("/:clinicianId", async (req, res) => {
  const clinicianId = Number(req.params.clinicianId);
  if (!clinicianId)
    return res.status(400).json({ error: "Invalid clinicianId" });

  const clinician = await prisma.clinician.findUnique({
    where: { id: clinicianId },
    select: {
      id: true,
      user_id: true,
      full_name: true,
      specialty: true,
      license_number: true,
      clinic_name: true,
      contact_email: true,
      contact_phone: true,
      office_address: true,
      inviteCode: true,
      inviteUpdatedAt: true,
    },
  });

  if (!clinician) return res.status(404).json({ error: "Clinician not found" });
  return res.json({ clinician });
});

/**
 * GET /clinicians/:clinicianId/patients
 * Patients linked to clinician, plus a simple goals completed %.
 */
router.get("/:clinicianId/patients", async (req, res) => {
  const clinicianId = Number(req.params.clinicianId);
  if (!clinicianId)
    return res.status(400).json({ error: "Invalid clinicianId" });

  const pts = await prisma.patient.findMany({
    where: { clinician_id: clinicianId },
    select: {
      id: true,
      full_name: true,
      created_at: true,
      goals: {
        select: { id: true, status: true, completed: true },
      },
    },
    orderBy: { id: "asc" },
  });

  const patients = pts.map((p) => {
    const total = p.goals.length;
    const done = p.goals.filter(
      (g) => g.completed === true || g.status === "completed"
    ).length;
    const goals_completed_pct = total ? Math.round((done / total) * 100) : 0;

    return {
      id: p.id,
      name: p.full_name,
      last_update: "—", // fill later if you track activity
      alerts: 0, // fill later from notifications/unread labs
      goals_completed_pct,
    };
  });

  return res.json({ patients });
});

/**
 * GET /clinicians/:clinicianId/approvals
 * Goals pending clinician approval for clinician’s patients.
 */
router.get("/:clinicianId/approvals", async (req, res) => {
  const clinicianId = Number(req.params.clinicianId);
  if (!clinicianId)
    return res.status(400).json({ error: "Invalid clinicianId" });

  const pendingGoals = await prisma.goal.findMany({
    where: {
      patient: { clinician_id: clinicianId },
      status: "pending_approval",
    },
    select: {
      id: true,
      title: true,
      created_at: true,
      patient: { select: { full_name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const approvals = pendingGoals.map((g) => ({
    id: g.id,
    patient: g.patient.full_name,
    title: g.title,
    description: g.description,
    submitted: g.created_at, // format on client
  }));

  return res.json({ approvals });
});

/**
 * POST /clinicians/:clinicianId/invite/regenerate
 * Regenerate invite code for a clinician.
 */
router.post("/:clinicianId/invite/regenerate", async (req, res) => {
  const clinicianId = Number(req.params.clinicianId);
  if (!clinicianId)
    return res.status(400).json({ error: "Invalid clinicianId" });

  const clin = await prisma.clinician.findUnique({
    where: { id: clinicianId },
  });
  if (!clin) return res.status(404).json({ error: "Clinician not found" });

  const code = generateInviteCode();
  await prisma.clinician.update({
    where: { id: clinicianId },
    data: { inviteCode: code, inviteUpdatedAt: new Date() },
  });

  return res.json({ inviteCode: code });
});

export default router;
