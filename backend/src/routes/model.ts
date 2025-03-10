import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

router.get("/chats", async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ chats });
  } catch (error) {
    next(error);
  }
});

router.post("/chats", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const { title = "New Chat" } = req.body;

    const newChat = await prisma.chat.create({
      data: {
        title,
        userId,
      },
    });

    res.status(201).json({
      message: "Chat created successfully",
      chat: newChat,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/chats/:chatId", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json({ chat });
  } catch (error) {
    next(error);
  }
});

router.delete("/chats/:chatId", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    await prisma.message.deleteMany({
      where: { chatId },
    });

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/chats/:chatId/messages", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "Message content is required" });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const userMessage = await prisma.message.create({
      data: {
        content,
        isUser: true,
        chatId,
      },
    });

    const modelResponse = await generateModelResponse(content);

    const modelMessage = await prisma.message.create({
      data: {
        content: modelResponse,
        isUser: false,
        chatId,
      },
    });

    const messageCount = await prisma.message.count({
      where: { chatId },
    });

    if (messageCount <= 2) {
      const newTitle = content.split(" ").slice(0, 5).join(" ") + "...";
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: newTitle },
      });
    }

    res.status(201).json({
      userMessage,
      modelMessage,
    });
  } catch (error) {
    next(error);
  }
});


//get response from model 
async function generateModelResponse(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "generate.py");
    const pythonprocess = spawn("python", [scriptPath, prompt], {
      cwd: path.dirname(scriptPath),
    });

    let output = "";
    let errorOutput = "";

    pythonprocess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonprocess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonprocess.on("close", (code) => {
      console.log(`Python exited with code ${code}`);
      console.log(`Raw stdout: "${output}"`);
      console.log(`Raw stderr: "${errorOutput}"`);
      if (code == 0) {
        try {
          const result = JSON.parse(output);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.response);
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: "${output}"`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonprocess.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

export default router;