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

/**
 * GET /clinicians/:clinicianId
 * Return clinician profile by clinician id.
 */
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
