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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const model_1 = __importDefault(require("./routes/model"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/user', auth_2.authenticateToken, user_1.default);
app.use('/api/model', auth_2.authenticateToken, model_1.default);
// Health check
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$connect();
            console.log('Connected to database');
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}
startServer();
