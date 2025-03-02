import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secre";

// Register
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password } = req.body;

      // Validate input
      if (!email || !username || !password) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        res.status(409).json({ message: "User already exists" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            username
          )}&background=random`,
        },
      });

      // Generate token
      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Return user data (without password)
      const { password: _, ...userData } = newUser;
      res.status(201).json({
        message: "User registered successfully",
        user: userData,
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });

        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Return user data (without password)
      const { password: _, ...userData } = user;
      res.status(200).json({
        message: "Login successful",
        user: userData,
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

// Check authentication
router.get("/verify", async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ authenticated: false });
      return;
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;
    res.status(200).json({
      authenticated: true,
      user: userData,
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
