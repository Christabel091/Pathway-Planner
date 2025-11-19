// routes/caretakers.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /caretakers/me/patients?userId=123
 * Returns all patients linked to this caretaker via patient_caretakers.
 */
router.get("/me/patients", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId || Number.isNaN(userId)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid userId in query" });
    }

    const caretaker = await prisma.caretaker.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!caretaker) {
      // No caretaker row yet, just return empty list
      return res.json({ patients: [] });
    }

    const links = await prisma.patientCaretaker.findMany({
      where: { caretaker_id: caretaker.id },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            gender: true,
            dob: true,
          },
        },
      },
      orderBy: { patient_id: "asc" },
    });

    const patients = links.map((l) => l.patient);
    return res.json({ patients });
  } catch (err) {
    console.error("GET /caretakers/me/patients error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /caretakers/link-patient
 * Body: { inviteCode: string, caretakerUserId: number }
 */
router.post("/link-patient", async (req, res) => {
  try {
    const { inviteCode, caretakerUserId } = req.body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return res.status(400).json({ error: "Invite code is required" });
    }

    const userIdNum = Number(caretakerUserId);
    if (!userIdNum || Number.isNaN(userIdNum)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid caretakerUserId" });
    }

    const caretaker = await prisma.caretaker.findUnique({
      where: { user_id: userIdNum },
      select: { id: true },
    });

    if (!caretaker) {
      return res
        .status(403)
        .json({ error: "Caretaker record not found for this user" });
    }

    // Look up patient by inviteCode (must be unique in schema)
    const patient = await prisma.patient.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        full_name: true,
        gender: true,
        dob: true,
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Invalid or expired invite code" });
    }

    const existingLink = await prisma.patientCaretaker.findFirst({
      where: {
        caretaker_id: caretaker.id,
        patient_id: patient.id,
      },
    });

    if (existingLink) {
      return res
        .status(409)
        .json({ error: "You are already linked to this patient" });
    }

    await prisma.patientCaretaker.create({
      data: {
        caretaker_id: caretaker.id,
        patient_id: patient.id,
      },
    });

    return res.json({
      success: true,
      message: "Patient linked successfully",
      patient,
    });
  } catch (err) {
    console.error("POST /caretakers/link-patient error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /caretakers/patients/:patientId?userId=123
 * View-only snapshot of a patient linked to this caretaker.
 */
router.get("/patients/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!patientId || Number.isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }

    const caretakerUserId = Number(req.query.userId);
    if (!caretakerUserId || Number.isNaN(caretakerUserId)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid userId in query" });
    }

    const caretaker = await prisma.caretaker.findUnique({
      where: { user_id: caretakerUserId },
      select: { id: true },
    });

    if (!caretaker) {
      return res.status(403).json({ error: "Caretaker record not found" });
    }

    const link = await prisma.patientCaretaker.findFirst({
      where: {
        caretaker_id: caretaker.id,
        patient_id: patientId,
      },
    });

    if (!link) {
      return res
        .status(403)
        .json({ error: "You are not linked to this patient" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        full_name: true,
        gender: true,
        dob: true,
        chronic_conditions: true,
        current_medications: true,
        goals: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            completed: true,
            due_date: true,
          },
          orderBy: { created_at: "desc" },
        },
        labs: {
          select: {
            id: true,
            lab_type: true,
            lab_value: true,
            unit: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.json(patient);
  } catch (err) {
    console.error("GET /caretakers/patients/:patientId error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
