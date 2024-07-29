var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import fs from 'fs/promises';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jobRoutes from './routes/jobs.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { DATABASE_DIR } from './constants/index.js';
import { recoverJobs, monitorJobs } from './utils/jobHelpers.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
export const app = express();
app.use(express.json());
app.use(cors());
const server = createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
fs.mkdir(DATABASE_DIR, { recursive: true })
    .then(() => console.log('Jobs directory created successfully.'))
    .catch(console.error);
app.use('/jobs', jobRoutes);
app.use(errorHandler);
setupSocketHandlers(io);
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield recoverJobs();
        server.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    });
}
setInterval(monitorJobs, 5000);
startServer().catch(console.error);
//# sourceMappingURL=index.js.map