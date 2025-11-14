import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//ensuring the access for env
import dotenv from "dotenv";
dotenv.config();

//connecting the database
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//secret key for the JWT, the contetn is in the env
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();
// ================= signup ============================
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Please enter your information" });
  }
  if (password.length < 8) {
    return res
      .status(401)
      .json({ error: "Password must be at least 8 characters long." });
  }

  // Server-side hashing is correct (keep it here)
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists!" });
    }

    const validRoles = ["patient", "physician", "caretaker", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "Please select a valid role" });
    }

    const newUser = await prisma.user.create({
      data: {
        UserName: username,
        email,
        password_hash: hashedPassword,
        role: role,
        profileCompleted: false,
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

    // Include id/role/profileCompleted in JWT so client can route quickly
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Signup successful!",
      token,
      user: {
        id: newUser.id,
        username: newUser.UserName,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted,
      },
    });
  } catch (err) {
    console.error("Signup Error: ", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ================= login =============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please enter your email and password" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login successful!",
    token,
    user: {
      id: user.id,
      username: user.UserName,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
    },
  });
});

// =============== protected (authoritative) ============
router.get("/protected", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user from DB to ensure up-to-date profileCompleted
    const dbUser = await prisma.user.findUnique({
      where: { email: decoded.email },
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

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "Access granted!",
      user: {
        id: dbUser.id,
        username: dbUser.UserName,
        email: dbUser.email,
        role: dbUser.role,
        profileCompleted: dbUser.profileCompleted,
      },
    });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
});
export default router;
