"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all chats for a user
router.get("/chats", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const chats = yield prisma.chat.findMany({
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
    }
    catch (error) {
        next(error);
    }
}));
router.post("/chats", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }
        const { title = "New Chat" } = req.body;
        const newChat = yield prisma.chat.create({
            data: {
                title,
                userId, // Now `userId` is guaranteed to be a valid string
            },
        });
        res.status(201).json({
            message: "Chat created successfully",
            chat: newChat,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Get chat by ID with messages
router.get("/chats/:chatId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { chatId } = req.params;
        const chat = yield prisma.chat.findFirst({
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
    }
    catch (error) {
        next(error);
    }
}));
// Delete chat
router.delete("/chats/:chatId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { chatId } = req.params;
        // Verify chat belongs to user
        const chat = yield prisma.chat.findFirst({
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
        yield prisma.message.deleteMany({
            where: { chatId },
        });
        // Delete chat
        yield prisma.chat.delete({
            where: { id: chatId },
        });
        res.status(200).json({ message: "Chat deleted successfully" });
    }
    catch (error) {
        next(error);
    }
}));
// Send message to model and get response
router.post("/chats/:chatId/messages", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { chatId } = req.params;
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ message: "Message content is required" });
            return;
        }
        // Verify chat belongs to user
        const chat = yield prisma.chat.findFirst({
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
        const userMessage = yield prisma.message.create({
            data: {
                content,
                isUser: true,
                chatId,
            },
        });
        // TODO: In a real implementation, this is where you would call your NLP model
        // For now, we're using a dummy response
        const modelResponse = yield generateModelResponse(content);
        // Save model response
        const modelMessage = yield prisma.message.create({
            data: {
                content: modelResponse,
                isUser: false,
                chatId,
            },
        });
        // Update chat title if it's the first message
        const messageCount = yield prisma.message.count({
            where: { chatId },
        });
        if (messageCount <= 2) {
            // Use the first few words of the user's first message as the chat title
            const newTitle = content.split(" ").slice(0, 5).join(" ") + "...";
            yield prisma.chat.update({
                where: { id: chatId },
                data: { title: newTitle },
            });
        }
        // Return both messages
        res.status(201).json({
            userMessage,
            modelMessage,
        });
    }
    catch (error) {
        next(error);
    }
}));
//function to call the python script for model
function generateModelResponse(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const scriptPath = path_1.default.join(__dirname, "..", "generate.py");
            const pythonprocess = (0, child_process_1.spawn)("python", [scriptPath, prompt], {
                cwd: path_1.default.dirname(scriptPath),
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
                        }
                        else {
                            resolve(result.response);
                        }
                    }
                    catch (parseError) {
                        reject(new Error(`Failed to parse python output : ${output}`));
                    }
                }
                else {
                    reject(new Error(`Python process failed wiht code ${code} : ${errorOutput}`));
                }
            });
            pythonprocess.on('error', (err) => {
                reject(new Error(`Failed to spwan Python process: ${err.message}`));
            });
        });
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
exports.default = router;
