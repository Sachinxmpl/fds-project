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
                userId,
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
router.delete("/chats/:chatId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { chatId } = req.params;
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
        yield prisma.message.deleteMany({
            where: { chatId },
        });
        yield prisma.chat.delete({
            where: { id: chatId },
        });
        res.status(200).json({ message: "Chat deleted successfully" });
    }
    catch (error) {
        next(error);
    }
}));
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
        const userMessage = yield prisma.message.create({
            data: {
                content,
                isUser: true,
                chatId,
            },
        });
        const modelResponse = yield generateModelResponse(content);
        const modelMessage = yield prisma.message.create({
            data: {
                content: modelResponse,
                isUser: false,
                chatId,
            },
        });
        const messageCount = yield prisma.message.count({
            where: { chatId },
        });
        if (messageCount <= 2) {
            const newTitle = content.split(" ").slice(0, 5).join(" ") + "...";
            yield prisma.chat.update({
                where: { id: chatId },
                data: { title: newTitle },
            });
        }
        res.status(201).json({
            userMessage,
            modelMessage,
        });
    }
    catch (error) {
        next(error);
    }
}));
//get response from model 
function generateModelResponse(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const scriptPath = path_1.default.join(__dirname, "..", "generate.py");
            const pythonprocess = (0, child_process_1.spawn)("python", [scriptPath, prompt], {
                cwd: path_1.default.dirname(scriptPath),
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
                        }
                        else {
                            resolve(result.response);
                        }
                    }
                    catch (parseError) {
                        reject(new Error(`Failed to parse Python output: "${output}"`));
                    }
                }
                else {
                    reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
                }
            });
            pythonprocess.on("error", (err) => {
                reject(new Error(`Failed to spawn Python process: ${err.message}`));
            });
        });
    });
}
exports.default = router;
