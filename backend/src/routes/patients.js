import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient, GoalStatus } from "@prisma/client";

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
  const { title, description, status, due_date } = req.body;
  try {
    //update goalStatus enum in prisma schema if new statuses are added
    const newGoal = await prisma.goal.create({
      data: {
        patient_id: parseInt(patientId),
        title,
        description,
        status: mapGoalStatus(status) || "active",

        due_date: due_date ? new Date(due_date) : null,
      },
    });
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
  const { goalId } = req.params;
  const { status, completed } = req.body;

  try {
    const id = parseInt(goalId, 10);

    // 1) Get the current goal (old status + patient)
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
      select: {
        status: true,
        patient_id: true,
        title: true,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const mappedStatus = status ? mapGoalStatus(status) : undefined;

    // 2) Decide *before* update if we should send a GOAL_APPROVED notification
    const shouldNotifyGoalApproved =
      mappedStatus &&
      existingGoal.status === "pending_approval" &&
      mappedStatus === "active";

    // 3) Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        status: mappedStatus,
        completed: completed !== undefined ? completed : undefined,
      },
    });

    if (shouldNotifyGoalApproved) {
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
            user_id: patient.user_id, // actual User.id
            type: "GOAL_APPROVED",
            entity: "goal",
            entity_id: updatedGoal.id, // or just `id`, same value
            payload: {
              title: `Your goal "${existingGoal.title}" has been approved by your clinician.`,
              message: "go to goals page to see more details",
            },
          },
        });
      }
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

export default patientRouter;
