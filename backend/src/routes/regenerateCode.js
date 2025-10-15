import express from "express";
import dotenv from "dotenv";
import generateInviteCode from "../../utils/generateCode";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const regenerateCodeRouter = express.Router();

// Endpoint to regenerate invite code for a clinician
regenerateCodeRouter.post("/clinician/invite", async (req, res) => {
  const { clinicianId } = req.body;
  if (!clinicianId) {
    return res.status(400).json({ error: "Invalid clinician ID" });
  }
  try {
    const clinician = await prisma.clinicianProfile.findUnique({
      where: { id: clinicianId },
    });
    if (!clinician) {
      return res.status(404).json({ error: "Clinician not found" });
    }
    const newCode = generateInviteCode();
    await prisma.clinicianProfile.update({
      where: { id: clinicianId },
      data: { inviteCode: newCode, inviteUpdatedAt: new Date() },
    });
    res
      .status(200)
      .json({ message: "Invite code regenerated", inviteCode: newCode });
  } catch (err) {
    console.error("Regenerate Invite Code Error: ", err);
    res.status(500).json({ error: "Server Error" });
  }
});
export default regenerateCodeRouter;
