// at the top of info.js (keep your existing imports)
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import crypto from "node:crypto";
import generateInviteCode from "../../utils/generateCode.js";
import { PrismaClient, Gender, BloodType } from "@prisma/client";

const prisma = new PrismaClient();
const infoRouter = express.Router();

// Normalize PEM from .env: remove wrapping quotes, convert \n to real newlines, normalize CRLF.
function normalizePemFromEnv(raw) {
  if (!raw) return "";
  let s = raw.trim();

  // strip accidental leading/trailing quotes some env UIs add
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }

  // convert literal \n to actual newlines; normalize Windows CRLF to \n
  s = s.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  // remove accidental leading spaces before BEGIN (can happen in .env)
  s = s
    .replace(/\n?[\t ]*-----BEGIN /g, "\n-----BEGIN ")
    .replace(/^\s+-----BEGIN /, "-----BEGIN ");

  return s.trim();
}

function getPrivateKeyPem() {
  return normalizePemFromEnv(process.env.RSA_PRIVATE_KEY_PEM);
}

function getPublicKeyPem() {
  return normalizePemFromEnv(process.env.RSA_PUBLIC_KEY_PEM);
}

function assertKeyMaterial() {
  const pub = getPublicKeyPem();
  const priv = getPrivateKeyPem();
  if (!pub || !pub.includes("BEGIN PUBLIC KEY")) {
    throw new Error("Missing/invalid RSA_PUBLIC_KEY_PEM in environment.");
  }
  if (!priv || !priv.includes("BEGIN PRIVATE KEY")) {
    throw new Error("Missing/invalid RSA_PRIVATE_KEY_PEM in environment.");
  }
}

// Decrypts base64 ciphertext produced by RSA-OAEP(SHA-256) in the browser.
// Returns parsed JSON object.
function rsaDecryptBase64ToJson(b64) {
  assertKeyMaterial();
  const privateKeyPem = getPrivateKeyPem();

  const ciphertext = Buffer.from(b64, "base64");
  const plaintext = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    ciphertext
  );
  return JSON.parse(plaintext.toString("utf8"));
}

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
// Frontend fetches this to encrypt onboarding fields client-side.
infoRouter.get("/crypto/public-key", (req, res) => {
  try {
    assertKeyMaterial();
    const pub = getPublicKeyPem(); // normalized
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(pub);
  } catch (err) {
    console.error("Public key error:", err);
    return res.status(500).send("Key not available");
  }
});

infoRouter.post("/patients", async (req, res) => {
  try {
    // Non-sensitive fields are sent in plaintext.
    const {
      userId,
      email,
      gender,
      blood_type,
      clinicianInviteCode,
      // encryption wrapper
      sensitive, // base64 ciphertext (required if enc fields present)
      enc_alg, // "RSA-OAEP-256"
      enc_v, // version number (1)
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    // Enforce encryption if present
    let decrypted = {};
    if (sensitive) {
      if (enc_alg !== "RSA-OAEP-256" || enc_v !== 1) {
        return res.status(400).json({ error: "Unsupported encryption format" });
      }
      try {
        decrypted = rsaDecryptBase64ToJson(sensitive);
      } catch (e) {
        console.error("Decryption failed:", e);
        return res.status(400).json({ error: "Invalid encrypted payload" });
      }
    } else {
      // (Optional) In dev mode you may allow plaintext for testing.
      // For strict compliance, require ciphertext:
      // return res.status(400).json({ error: "Missing encrypted payload" });
      decrypted = req.body; // fallback for local/testing without encryption
    }

    // Merge decrypted PHI with non-sensitive fields
    const {
      full_name,
      dob,
      address,
      phone_number,
      relative_contact_name,
      relative_contact_email,
      relative_contact_phone,
      allergies,
      chronic_conditions,
      current_medications,
      height_cm,
      weight_kg,
      // any extra decrypted fields ignored safely
    } = decrypted;

    // Ensure profile does not already exist
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
      full_name: emptyToNull(full_name),
      dob: toDateOrNull(dob), // DateTime
      gender: genderEnum ?? null, // Gender enum or null
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
      data.clinician_id = 1; // default clinician (or remove if not desired)
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
//  Caretaker onboarding (no encryption needed)
infoRouter.post("/caretakers", async (req, res) => {
  try {
    const { userId, email, full_name, relationship, phone_number } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    if (!full_name || !full_name.toString().trim()) {
      return res.status(400).json({ error: "Full name is required" });
    }

    // Prevent duplicate caretaker profile for the same user
    const existing = await prisma.caretaker.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Profile already exists, kindly login" });
    }

    const newProfile = await prisma.caretaker.create({
      data: {
        user_id: userId,
        full_name: full_name.trim(),
        relationship: emptyToNull(relationship),
        phone_number: emptyToNull(phone_number),
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        relationship: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Mark the user's onboarding as completed (mirrors clinician/patient flow)
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
      message: "Caretaker profile created successfully",
      profile: newProfile,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error creating caretaker profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Optional: fetch a caretaker profile (parity with GET /clinicians/:id)
infoRouter.get("/caretakers/:id", async (req, res) => {
  try {
    const caretakerId = parseInt(req.params.id, 10);
    if (!caretakerId) {
      return res.status(400).json({ error: "Invalid caretaker ID" });
    }

    const caretaker = await prisma.caretaker.findUnique({
      where: { id: caretakerId },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        relationship: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!caretaker) {
      return res.status(404).json({ error: "Caretaker not found" });
    }

    return res.status(200).json({ profile: caretaker });
  } catch (error) {
    console.error("Error fetching caretaker profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// --- Admin onboarding (no separate table needed) ---
infoRouter.post("/admins", async (req, res) => {
  try {
    const { userId, email, display_name } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    // Update only the User record: mark as onboarded, sync email,
    // and optionally set display name into UserName.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileCompleted: true,
        email,
        ...(display_name && display_name.trim()
          ? { UserName: display_name.trim() }
          : {}),
      },
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
      message: "Admin onboarding completed",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error completing admin onboarding:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default infoRouter;
