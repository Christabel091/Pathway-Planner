import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";


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
app.use("/auth", authRoutes);

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
