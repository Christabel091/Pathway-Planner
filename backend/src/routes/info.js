import express from "express";
import dotenv from "dotenv";
import generateInviteCode from "../../utils/generateCode.js";
dotenv.config();
import { PrismaClient, Gender, BloodType } from "@prisma/client";

const prisma = new PrismaClient();
const infoRouter = express.Router();

const emptyToNull = (v) =>
  v === "" || v === undefined || v === null ? null : v;

/** Coerce to number (for Prisma Decimal types). Returns null if not a finite number. */
const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toDateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const mapGender = (val) => {
  if (!val) return null;
  let key = val.toString().trim().toLowerCase().replace(/\s+/g, "_");

  // normalize common alias
  if (key === "prefer_not_to_say" || key === "not_specified")
    key = "prefer_not_say";

  // Keys must be exactly one of: male, female, other, prefer_not_say
  if (Object.prototype.hasOwnProperty.call(Gender, key)) {
    return Gender[key]; // e.g., Gender.female
  }
  return null;
};

const mapBloodType = (val) => {
  if (!val) return null;

  const s = val.toString().trim().toUpperCase();
  // Extract base (A, B, AB, O)
  const baseMatch = s.match(/^(AB|A|B|O)/);
  const base = baseMatch ? baseMatch[1] : null;
  if (!base) return null;

  // Suffix
  const suffix = s.includes("+") ? "pos" : s.includes("-") ? "neg" : null;
  if (!suffix) return null;

  const key = `${base}_${suffix}`; // e.g., "O_pos", "AB_neg"
  if (Object.prototype.hasOwnProperty.call(BloodType, key)) {
    return BloodType[key]; // e.g., BloodType.O_pos
  }
  return null;
};

infoRouter.post("/patients", async (req, res) => {
  try {
    const {
      userId,
      email,
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

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    // user_id is unique in your schema, so findUnique is OK
    const existingProfile = await prisma.patient.findUnique({
      where: { user_id: userId },
    });
    if (existingProfile) {
      return res
        .status(400)
        .json({ error: "Profile already exists, kindly login" });
    }

    // Map enums to Prisma enum members
    const genderEnum = mapGender(gender);
    const bloodEnum = mapBloodType(blood_type);

    // If user provided a value we can't map, fail fast with 400
    if (gender && !genderEnum) {
      return res.status(400).json({
        error: `Unsupported gender value: "${gender}". Valid: male, female, other, prefer_not_say.`,
      });
    }
    if (blood_type && !bloodEnum) {
      return res.status(400).json({
        error: `Unsupported blood type: "${blood_type}". Valid: A+/A-/B+/B-/AB+/AB-/O+/O-.`,
      });
    }

    // Build data object (respecting Decimal & nullable fields)
    const data = {
      user_id: userId,
      full_name,
      dob: toDateOrNull(dob), // DateTime
      gender: genderEnum ?? null, // Gender enum or null (schema allows nullable)
      address: emptyToNull(address),
      phone_number: emptyToNull(phone_number),
      relative_contact_name: emptyToNull(relative_contact_name),
      relative_contact_email: emptyToNull(relative_contact_email),
      relative_contact_phone: emptyToNull(relative_contact_phone),
      blood_type: bloodEnum ?? null, // BloodType enum or null
      allergies: emptyToNull(allergies),
      chronic_conditions: emptyToNull(chronic_conditions),
      current_medications: emptyToNull(current_medications),
      height_cm: toNumberOrNull(height_cm), // Decimal in Prisma
      weight_kg: toNumberOrNull(weight_kg), // Decimal in Prisma
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Clinician code (optional)
    const code = (clinicianInviteCode || "").trim();
    if (code.length > 0) {
      const clinicianProfile = await prisma.clinician.findUnique({
        where: { inviteCode: code },
      });
      if (!clinicianProfile) {
        return res.status(400).json({
          error:
            "Invalid clinician invite code, leave input empty or provide a valid code.",
        });
      }
      data.clinician_id = clinicianProfile.id;
    } else {
      data.clinician_id = 1; // default clinician
    }

    const newProfile = await prisma.patient.create({
      data,
      select: {
        id: true,
        user_id: true,
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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true, email },
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

infoRouter.post("/clinicians", async (req, res) => {
  try {
    const {
      userId,
      email,
      full_name,
      specialty,
      license_number,
      clinic_name,
      contact_phone,
      office_address,
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const existingProfile = await prisma.clinician.findUnique({
      where: { user_id: userId },
    });
    if (existingProfile) {
      return res
        .status(400)
        .json({ error: "Profile already exists, kindly login" });
    }

    // generate a unique invite code
    let inviteCode = generateInviteCode();
    while (await prisma.clinician.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const newProfile = await prisma.clinician.create({
      data: {
        user_id: userId,
        full_name,
        contact_email: email,
        specialty: emptyToNull(specialty),
        license_number: emptyToNull(license_number),
        clinic_name: emptyToNull(clinic_name),
        contact_phone: emptyToNull(contact_phone),
        office_address: emptyToNull(office_address),
        inviteCode,
        inviteUpdatedAt: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        contact_email: true,
        inviteCode: true,
        inviteUpdatedAt: true,
        created_at: true,
        updated_at: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true, email },
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

infoRouter.put("/patients/clinician/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const { clinicianInviteCode } = req.body;

    if (!clinicianInviteCode) {
      return res
        .status(400)
        .json({ error: "Clinician invite code is required" });
    }

    const clinicianProfile = await prisma.clinician.findUnique({
      where: { inviteCode: clinicianInviteCode },
    });
    if (!clinicianProfile) {
      return res.status(400).json({ error: "Invalid clinician invite code" });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { clinician_id: clinicianProfile.id, updated_at: new Date() },
      select: {
        id: true,
        user_id: true,
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

    return res.status(200).json({
      message: "Clinician updated successfully",
      profile: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating clinician:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

infoRouter.get("/clinicians/:id", async (req, res) => {
  try {
    const clinicianId = parseInt(req.params.id, 10);
    if (!clinicianId) {
      return res.status(400).json({ error: "Invalid clinician ID" });
    }

    const clinicianProfile = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      select: {
        id: true,
        user_id: true,
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
