import express, { RequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import modelRoutes from "./routes/model";
import { errorHandler } from "./middleware/errorHandler";
import { authenticateToken } from "./middleware/auth";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", authenticateToken as RequestHandler, userRoutes);
app.use("/api/model", authenticateToken as RequestHandler, modelRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
