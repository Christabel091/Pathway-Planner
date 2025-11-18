// --------------------------------------------------------
// MEDICATION ROUTES (FINAL + CONSISTENT)
// --------------------------------------------------------

import express from "express";
import { PrismaClient } from "@prisma/client";

const patientRouter = express.Router();
const prisma = new PrismaClient();

// 1) PATIENT: Get medications by USER ID (matches labs)
patientRouter.get("/:userId/medications", async (req, res) => {
  try {

    console.log("PARAM USER ID:", req.params.userId);   // ← ADD THIS LINE
    
    const userId = Number(req.params.userId);

    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { id: true }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const meds = await prisma.medicine.findMany({
      where: { patient_id: patient.id },
      orderBy: { id: "desc" }
    });

    res.json({ meds });   // ⭐ CHANGE THIS LINE (it was res.json(meds))
  } catch (err) {
    console.error("Error fetching medications:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});



// clinician: get medications by PATIENT ID
patientRouter.get("/by-patient/:patientId/medications", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);

    const meds = await prisma.medicine.findMany({
      where: { patient_id: patientId },
      orderBy: { id: "desc" }
    });

    res.json({ meds });   // ⭐ CHANGE THIS LINE (it was res.json(meds))
  } catch (err) {
    console.error("Error fetching medications:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});



/* -------------------------------------------------------
   3) CLINICIAN: Assign medication TO patient (patientId)
-------------------------------------------------------- */
patientRouter.post("/:patientId/medications", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const { medicine_name, dosage, frequency, time_of_day, instructions } =
      req.body;

    if (!medicine_name) {
      return res.status(400).json({ error: "medicine_name is required" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, user_id: true },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const newMed = await prisma.medicine.create({
      data: {
        patient_id: patient.id,
        medicine_name,
        dosage,
        frequency,
        preferred_time: time_of_day,
        instructions,
        taken: false,
      },
    });

    // optional notification
    await prisma.notification.create({
      data: {
        user_id: patient.user_id,
        type: "MEDICATION",
        entity: "medication",
        entity_id: newMed.id,
        payload: {
          title: "New Medication Assigned",
          message: `${medicine_name} was added to your medication list.`,
        },
      },
    });

    res.status(201).json(newMed);
  } catch (err) {
    console.error("Error assigning medication:", err);
    res.status(500).json({ error: "Failed to add medication" });
  }
});


/* -------------------------------------------------------
   4) DELETE a medication (clinician or patient)
-------------------------------------------------------- */
patientRouter.delete("/medications/:medId", async (req, res) => {
  try {
    const medId = Number(req.params.medId);

    await prisma.medicine.delete({
      where: { id: medId },
    });

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting medication:", err);
    res.status(500).json({ error: "Failed to delete medication" });
  }
});


export default patientRouter;
