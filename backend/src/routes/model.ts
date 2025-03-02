import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";
import path from "path"

const router = Router();
const prisma = new PrismaClient();

// Get all chats for a user
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
        userId, // Now `userId` is guaranteed to be a valid string
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

// Get chat by ID with messages
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

// Delete chat
router.delete("/chats/:chatId", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    // Verify chat belongs to user
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

    // Delete all messages in chat
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Delete chat
    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Send message to model and get response
router.post("/chats/:chatId/messages", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "Message content is required" });
      return;
    }

    // Verify chat belongs to user
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

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        isUser: true,
        chatId,
      },
    });

    // TODO: In a real implementation, this is where you would call your NLP model
    // For now, we're using a dummy response
    const modelResponse = await generateModelResponse(content);

    // Save model response
    const modelMessage = await prisma.message.create({
      data: {
        content: modelResponse,
        isUser: false,
        chatId,
      },
    });

    // Update chat title if it's the first message
    const messageCount = await prisma.message.count({
      where: { chatId },
    });

    if (messageCount <= 2) {
      // Use the first few words of the user's first message as the chat title
      const newTitle = content.split(" ").slice(0, 5).join(" ") + "...";
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: newTitle },
      });
    }

    // Return both messages
    res.status(201).json({
      userMessage,
      modelMessage,
    });
  } catch (error) {
    next(error);
  }
});

//function to call the python script for model
async function generateModelResponse(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {

    const scriptPath = path.join(__dirname,"..", "generate.py") ; 

    const pythonprocess = spawn("python", [scriptPath, prompt], {
      cwd: path.dirname(scriptPath),
    });

    let output = "";
    let errorOutput = "";

    //capture stdout(model response)
    pythonprocess.stdout.on("data", (data) => {
      output += data.toString();
    });

    //capture stderr (erros from python)
    pythonprocess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonprocess.on("close", (code) => {
      if (code == 0) {
        try {
          // Parse JSON output from Python
          const result = JSON.parse(output);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.response);
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse python output : ${output}`));
        }
      } else {
        reject(
          new Error(`Python process failed wiht code ${code} : ${errorOutput}`)
        );
      }
    });
    
    pythonprocess.on('error' , (err) =>{
        reject(new Error(`Failed to spwan Python process: ${err.message}`))
    })

  });
}

// Guidance for your friend’s custom model integration:
/*
  When integrating your friend’s trained model:
  1. Replace MODEL_NAME in generate.py with the path to their model folder (e.g., "./models/custom_wikitext_gpt").
     - Expected format: A directory with model weights (e.g., pytorch_model.bin) and config files.
  2. Adjust generate.py parameters (max_length, temperature, etc.) to match their training setup.
     - Example: If trained on WikiText-2, they might suggest specific sampling params for coherence.
  3. Ensure the model is compatible with transformers (e.g., PyTorch or TensorFlow format).
     - If not, they’ll need to provide a custom inference function in generate.py.
  4. Test with a sample prompt to verify output matches your Message type:
     - { id: string, content: string, timestamp: number, sender: 'ai' }
  5. Update spawn args if the script name changes (e.g., spawn('python', ['custom_generate.py', prompt])).
  6. Handle resource needs:
     - GPU: Ensure CUDA is installed if their model requires it (pip install torch with CUDA support).
     - RAM: GPT-2 needs ~2-4GB; their model might need more—test memory usage.
*/


// Dummy function to generate model response
// This would be replaced with actual model integration
// async function generateModelResponse(prompt: string): Promise<string> {
//   // For demo purposes, generate a dummy response
//   // In production, this would call your actual GPT model API

//   const responses = [
//     "Based on the WikiText-2 dataset I was trained on, I can generate a response that's contextually relevant to your prompt.",
//     "Interesting question! Let me generate a response using my transformer-based architecture.",
//     "According to the knowledge I've acquired during training, I can provide this information related to your query.",
//     "The multi-head self-attention mechanism in my architecture helps me understand the context of your prompt and generate this response.",
//     "I've analyzed your input and generated this response using my feedforward neural network and self-attention layers.",
//   ];

//   const randomIndex = Math.floor(Math.random() * responses.length);
//   const baseResponse = responses[randomIndex];

//   return `${baseResponse}\n\nRegarding "${prompt}": This is a placeholder response. In a production environment, this would be generated by the actual NLP model trained on WikiText-2 using the GPT architecture described in your project.`;
// }

export default router;
