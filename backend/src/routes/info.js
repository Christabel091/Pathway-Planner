import express from "express";
import dotenv from "dotenv";
import generateInviteCode from "../../utils/generateCode.js";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const infoRouter = express.Router();

//endpoint to create patient profile information
infoRouter.post("/patients", async (req, res) => {
  const {
    userId,
    email,
    role,
    full_name,
    dob,
    gender,
    address,
    phone_number,
    relative_contact_name,
    relative_contact_email,
    relative_contact_phone,
    blood_type,
    allergies,
    chronic_conditions,
    current_medications,
    height_cm,
    weight_kg,
    clinicianInviteCode,
  } = req.body;
  if (!userId || !email || role !== "patient") {
    return res.status(400).json({ error: "Invalid user data" });
  }

  //create the patient profile and update the user to profileCompleted = true

  try {
    const existingProfile = await prisma.patient.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      return res
        .status(400)
        .json({ error: "Profile already exists, kindly login" });
    }
    if (clinicianInviteCode) {
      const clinicianProfile = await prisma.clinician.findUnique({
        where: { inviteCode: clinicianInviteCode },
      });
      if (!clinicianProfile) {
        return res.status(400).json({ error: "Invalid clinician invite code" });
      }
      // Optionally, you can link the patient to the clinician here if needed
      const clinician_id = clinicianProfile.id;
      const newProfile = await prisma.patient.create({
        data: {
          userId,
          full_name,
          dob: new Date(dob),
          gender,
          address,
          phone_number,
          relative_contact_name,
          relative_contact_email,
          relative_contact_phone,
          blood_type,
          allergies,
          chronic_conditions,
          current_medications,
          height_cm,
          weight_kg,
          clinician_id,
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          userId: true,
          full_name: true,
          dob: true,
          gender,
          address: true,
          phone_number: true,
          relative_contact_name: true,
          relative_contact_email: true,
          relative_contact_phone: true,
          blood_type: true,
          allergies: true,
          chronic_conditions: true,
          current_medications: true,
          height_cm: true,
          weight_kg: true,
          clinician_id: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (!newProfile) {
        return res
          .status(500)
          .json({ error: "Failed to create profile, please try again" });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileCompleted: true, email: email },
        select: {
          id: true,
          email: true,
          UserName: true,
          role: true,
          profileCompleted: true,
          created_at: true,
          updated_at: true,
        },
      });
      return res.status(201).json({
        message: "Profile created successfully",
        profile: newProfile,
        user: updatedUser,
      });
    } else {
      //register with default clinician_id  = 1
      const newProfile = await prisma.patient.create({
        data: {
          userId,
          full_name,
          dob: new Date(dob),
          gender,
          address,
          phone_number,
          relative_contact_name,
          relative_contact_email,
          relative_contact_phone,
          blood_type,
          allergies,
          chronic_conditions,
          current_medications,
          height_cm,
          weight_kg,
          clinician_id: 1, //default clinician
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          userId: true,
          full_name: true,
          dob: true,
          gender,
          address,
          phone_number,
          relative_contact_name,
          relative_contact_email,
          relative_contact_phone,
          blood_type,
          allergies,
          chronic_conditions,
          current_medications,
          height_cm,
          weight_kg,
          clinician_id: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (!newProfile) {
        return res
          .status(500)
          .json({ error: "Failed to create profile, please try again" });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileCompleted: true, email: email },
        select: {
          id: true,
          email: true,
          UserName: true,
          role: true,
          profileCompleted: true,
          created_at: true,
          updated_at: true,
        },
      });
      return res.status(201).json({
        message: "Profile created successfully",
        profile: newProfile,
        user: updatedUser,
      });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

//endpoint to create clinician profile information
infoRouter.post("/clinicians", async (req, res) => {
  const { userId, email, full_name } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: "Invalid user data" });
  }
  try {
    const existingProfile = await prisma.clinician.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      return res
        .status(400)
        .json({ error: "Profile already exists, kindly login" });
    }

    //if true generate one store it in the db and return it
    const newInviteCode = generateInviteCode();
    //check if the invite code already exists, if it does keep generating until it is unique
    let uniqueCode = newInviteCode;
    let codeExists = await prisma.clinician.findUnique({
      where: { inviteCode: uniqueCode },
    });
    while (codeExists) {
      uniqueCode = generateInviteCode();
      codeExists = await prisma.clinician.findUnique({
        where: { inviteCode: uniqueCode },
      });
    }
    //store the unique code in the db with the current timestamp and clinician profile
    const newProfile = await prisma.clinician.create({
      data: {
        userId,
        full_name,
        contact_email: email,
        inviteCode: uniqueCode,
        inviteUpdatedAt: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        userId: true,
        full_name: true,
        contact_email: true,
        inviteCode: true,
        inviteUpdatedAt: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!newProfile) {
      return res.status(500).json({ error: "Failed to create profile" });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true, email: email },
      select: {
        id: true,
        email: true,
        UserName: true,
        role: true,
        profileCompleted: true,
        created_at: true,
        updated_at: true,
      },
    });
    return res.status(201).json({
      message: "Profile created successfully",
      profile: newProfile,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

//update patient's clinican from default to selected clinician
infoRouter.put("/patients/clinician/:id", async (req, res) => {
  const patientId = parseInt(req.params.id);
  const { clinicianInviteCode } = req.body;
  if (!clinicianInviteCode) {
    return res.status(400).json({ error: "Clinician invite code is required" });
  }
  try {
    const clinicianProfile = await prisma.clinician.findUnique({
      where: { inviteCode: clinicianInviteCode },
    });
    if (!clinicianProfile) {
      return res.status(400).json({ error: "Invalid clinician invite code" });
    }
    const clinician_id = clinicianProfile.id;
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { clinician_id, updated_at: new Date() },
      select: {
        id: true,
        userId: true,
        full_name: true,
        dob: true,
        gender: true,
        address: true,
        phone_number: true,
        relative_contact_name: true,
        relative_contact_email: true,
        relative_contact_phone: true,
        blood_type: true,
        allergies: true,
        chronic_conditions: true,
        current_medications: true,
        height_cm: true,
        weight_kg: true,
        clinician_id: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!updatedPatient) {
      return res.status(500).json({ error: "Failed to update clinician" });
    }
    return res.status(200).json({
      message: "Clinician updated successfully",
      profile: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating clinician:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

//fetch clinician profile by clincian id for display on patient profule page
infoRouter.get("/clinicians/:id", async (req, res) => {
  const clinicianId = parseInt(req.params.id);
  if (!clinicianId) {
    return res.status(400).json({ error: "Invalid clinician ID" });
  }
  try {
    const clinicianProfile = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      select: {
        id: true,
        userId: true,
        full_name: true,
        contact_email: true,
        contact_phone: true,
        office_address: true,
        inviteCode: true,
        inviteUpdatedAt: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!clinicianProfile) {
      return res.status(404).json({ error: "Clinician not found" });
    }
    return res.status(200).json({ profile: clinicianProfile });
  } catch (error) {
    console.error("Error fetching clinician profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
});
export default infoRouter;
