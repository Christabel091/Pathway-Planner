import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import infoRouter from "./routes/info.js";
import regenerateCodeRouter from "./routes/regenerateCode.js";
//check
console.log("JWT Secret:", process.env.JWT_SECRET);

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/onboarding", infoRouter);
app.use("/regenerate", regenerateCodeRouter);
app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
