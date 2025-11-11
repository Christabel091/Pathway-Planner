import express from "express";
import dotenv from "dotenv";
dotenv.config();
import crypto from "node:crypto";
import generateInviteCode from "../../utils/generateCode.js";
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
        journals: { take: 10, orderBy: { created_at: "desc" } }, // sample paging
        labs: { take: 5, orderBy: { created_at: "desc" } },
        meals: { take: 10, orderBy: { created_at: "desc" } },
        medicines: true,
        caretakerLinks: { include: { caretaker: true } },
        symptoms: { take: 20, orderBy: { created_at: "desc" } },
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

//patch goal for patient update status and completed
patientRouter.patch("/goals/:goalId", async (req, res) => {
  const { goalId } = req.params;
  const { status, completed } = req.body;
  try {
    const updatedGoal = await prisma.goal.update({
      where: { id: parseInt(goalId) },
      data: {
        status: status ? mapGoalStatus(status) : undefined,
        completed: completed !== undefined ? completed : undefined,
      },
    });
    res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: "Internal server error" });
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
