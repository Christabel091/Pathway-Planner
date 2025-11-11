// routes/regenerateCode.js  (if you keep it)
import express from "express";
import { PrismaClient } from "@prisma/client";
import generateInviteCode from "../../utils/generateCode.js";

const prisma = new PrismaClient();
const regenerateCodeRouter = express.Router();

regenerateCodeRouter.post(
  "/clinician/invite/:clinicianId",
  async (req, res) => {
    const { clinicianId } = req.params;

    if (!clinicianId)
      return res.status(400).json({ error: "Invalid clinician ID" });

    const clin = await prisma.clinician.findUnique({
      where: { id: Number(clinicianId) },
    });
    if (!clin) return res.status(404).json({ error: "Clinician not found" });

    const newCode = generateInviteCode();
    await prisma.clinician.update({
      where: { id: Number(clinicianId) },
      data: { inviteCode: newCode, inviteUpdatedAt: new Date() },
    });

    return res.json({
      message: "Invite code regenerated",
      inviteCode: newCode,
    });
  }
);

export default regenerateCodeRouter;
