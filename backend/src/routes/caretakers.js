// routes/caretakers.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /caretakers/me/patients
 * Returns all patients linked to this caretaker via patient_caretakers.
 */
router.get("/me/patients", async (req, res) => {
  try {
    // only caretakers are allowed
    if (req.user.role !== "caretaker") {
      return res.status(403).json({ error: "Not a caretaker" });
    }

    // find caretaker row using user_id
    const caretaker = await prisma.caretaker.findUnique({
      where: { user_id: req.user.id },
      select: { id: true }
    });

    if (!caretaker) {
      return res.json({ patients: [] });
    }

    // fetch join-table links, include patient details
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
 * GET /caretakers/patients/:patientId
 * Full snapshot of a patient IF the caretaker is linked to them.
 */
router.get("/patients/:patientId", async (req, res) => {
  try {
    if (req.user.role !== "caretaker") {
      return res.status(403).json({ error: "Not a caretaker" });
    }

    const patientId = Number(req.params.patientId);
    if (!patientId)
      return res.status(400).json({ error: "Invalid patientId" });

    // find caretaker row first
    const caretaker = await prisma.caretaker.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    });

    if (!caretaker) {
      return res.status(403).json({ error: "Caretaker record not found" });
    }

    // ensure caretaker is actually linked to this patient
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

    // fetch full patient snapshot like clinician logic does
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