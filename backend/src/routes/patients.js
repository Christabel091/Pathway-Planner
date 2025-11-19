// --------------------------------------------------------
// MEDICATION ROUTES (FINAL + CONSISTENT)
// --------------------------------------------------------

import express from "express";
import { PrismaClient } from "@prisma/client";

const patientRouter = express.Router();
const prisma = new PrismaClient();

//route to get patient by user id
patientRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const patient = await prisma.patient.findUnique({
      where: { user_id: parseInt(userId) },
      include: {
        clinician: true, // single relation
        goals: true, // array relation
        aiSuggestions: true,
        labs: { take: 5, orderBy: { created_at: "desc" } },
        medicines: true,
        caretakerLinks: { include: { caretaker: true } },
      },
    });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//create goal for patient

//map goal status
const mapGoalStatus = (status) => {
  if (!status) return null;
  if (Object.prototype.hasOwnProperty.call(GoalStatus, status)) {
    return GoalStatus[status];
  }
};
patientRouter.post("/goals/:patientId", async (req, res) => {
  const { patientId } = req.params;
  const { title, description, status, due_date, aiSuggestionId } = req.body;

  try {
    const newGoal = await prisma.goal.create({
      data: {
        patient_id: parseInt(patientId, 10),
        title,
        description,
        status: mapGoalStatus(status) || "active",
        due_date: due_date ? new Date(due_date) : null,
      },
    });
    if (aiSuggestionId) {
      try {
        await prisma.aiSuggestion.delete({
          where: { id: Number(aiSuggestionId) },
        });
      } catch (err) {
        console.warn(
          `Failed to delete AiSuggestion id=${aiSuggestionId} after goal creation`,
          err
        );
      }
    }

    res.status(201).json(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get goals for patient
patientRouter.get("/goals/:patientId", async (req, res) => {
  const { patientId } = req.params;
  try {
    const goals = await prisma.goal.findMany({
      where: { patient_id: parseInt(patientId) },
    });
    res.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//delete goal for patient
patientRouter.delete("/goals/:goalId", async (req, res) => {
  const { goalId } = req.params;
  try {
    await prisma.goal.delete({
      where: { id: parseInt(goalId) },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

patientRouter.patch("/goals/:goalId", async (req, res) => {
  console.log("changing goal status");
  const { goalId } = req.params;
  const { status, completed } = req.body;

  try {
    const id = parseInt(goalId, 10);

    // 1) Get the current goal (old state)
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
      select: {
        status: true,
        patient_id: true,
        title: true,
        completed: true,
        due_date: true,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const mappedStatus = status ? mapGoalStatus(status) : undefined;

    //triger flags for ai suggestions
    // clinician approves goal
    const isClinicianApproval =
      mappedStatus &&
      existingGoal.status === "pending_approval" &&
      mappedStatus === "active";

    // clinician denies goal
    const isClinicianDenial =
      mappedStatus &&
      existingGoal.status === "pending_approval" &&
      (mappedStatus === "cancelled" || mappedStatus === "ejected");

    // patient completes goal now
    const isCompletingNow =
      typeof completed === "boolean" &&
      completed === true &&
      existingGoal.completed === false;

    // early / late completion (only meaningful if we have a due_date)
    let isEarlyCompletion = false;
    let isLateCompletion = false;

    if (isCompletingNow && existingGoal.due_date) {
      const now = new Date();
      const due = new Date(existingGoal.due_date);

      if (now < due) {
        isEarlyCompletion = true;
      } else if (now > due) {
        isLateCompletion = true;
      }
      // If you want a “grace period”, add thresholds here.
    }

    const shouldTriggerAiOnCompletion =
      isCompletingNow && (isEarlyCompletion || isLateCompletion);

    // 2) Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        status: mappedStatus,
        completed: typeof completed === "boolean" ? completed : undefined,
      },
    });

    // 3) Notification on approval (your existing logic)
    if (isClinicianApproval) {
      const patient = await prisma.patient.findUnique({
        where: { id: existingGoal.patient_id },
        select: { user_id: true },
      });

      if (!patient) {
        console.warn(
          `No patient found for patient_id=${existingGoal.patient_id} when creating GOAL_APPROVED notification`
        );
      } else {
        await prisma.notification.create({
          data: {
            user_id: patient.user_id,
            type: "GOAL_APPROVED",
            entity: "goal",
            entity_id: updatedGoal.id,
            payload: {
              title: `Your goal "${existingGoal.title}" has been approved by your clinician.`,
              message: "go to goals page to see more details",
            },
          },
        });
      }
    }

    // 4) AI suggestions triggers
    if (isClinicianApproval) {
      console.log("calling goalai func 1");
      await generateAndStoreGoalSuggestions(
        prisma,
        existingGoal.patient_id,
        updatedGoal.id,
        "clinician_approved_goal"
      );
    }

    if (isClinicianDenial) {
      console.log("calling goalai func 2");
      await generateAndStoreGoalSuggestions(
        prisma,
        existingGoal.patient_id,
        updatedGoal.id,
        "clinician_denied_goal"
      );
    }

    if (shouldTriggerAiOnCompletion) {
      console.log("calling goalai func 3");
      const reason = isEarlyCompletion
        ? "goal_completed_early"
        : "goal_completed_late";

      await generateAndStoreGoalSuggestions(
        prisma,
        existingGoal.patient_id,
        updatedGoal.id,
        reason
      );
    }

    return res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

patientRouter.get("/:userId/labs", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    // find patient by user_id
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const labs = await prisma.labResult.findMany({
      where: { patient_id: patient.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        lab_type: true,
        lab_value: true,
        unit: true,
        source: true,
        file_url: true,
        created_at: true,
        read_at: true,
      },
    });

    res.json({ patientId: patient.id, labs });
  } catch (e) {
    console.error("GET /patients/:userId/labs error", e);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

// 1) PATIENT: Get medications by USER ID (matches labs)
patientRouter.get("/:userId/medications", async (req, res) => {
  try {
    console.log("PARAM USER ID:", req.params.userId); // ← ADD THIS LINE

    const userId = Number(req.params.userId);

    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const meds = await prisma.medicine.findMany({
      where: { patient_id: patient.id },
      orderBy: { id: "desc" },
    });

    res.json({ meds }); // ⭐ CHANGE THIS LINE (it was res.json(meds))
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
      orderBy: { id: "desc" },
    });

    res.json({ meds }); // ⭐ CHANGE THIS LINE (it was res.json(meds))
  } catch (err) {
    console.error("Error fetching medications:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

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

// Delete a lab record
patientRouter.delete("/labs/:labId", async (req, res) => {
  const { labId } = req.params;

  try {
    await prisma.labResult.delete({
      where: { id: Number(labId) },
    });

    res.json({ ok: true });
  } catch (err) {
    // Prisma 'record not found'
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Lab not found" });
    }

    console.error("Error deleting lab:", err);
    res.status(500).json({ error: "Failed to delete lab" });
  }
});

// Get labs for a specific patient (by patient primary key) for clinician view
patientRouter.get("/by-patient/:patientId/labs", async (req, res) => {
  const { patientId } = req.params;

  try {
    const labs = await prisma.labResult.findMany({
      where: { patient_id: Number(patientId) },
      orderBy: { created_at: "desc" },
    });

    res.json({ labs });
  } catch (err) {
    console.error("Error fetching labs for patient:", err);
    res.status(500).json({ error: "Failed to load lab results" });
  }
});

// POST /patients/me/generate-caretaker-code
router.post("/me/generate-caretaker-code", requireAuth, async (req, res) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can generate codes" });
  }

  const code = generateInviteCode(8);

  const updated = await prisma.patient.update({
    where: { user_id: req.user.id },
    data: { caretakerInviteCode: code },
  });

  res.json({ code });
});

export default patientRouter;
