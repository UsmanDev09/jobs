import dotenv from 'dotenv'
dotenv.config()

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

const app = express();
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

async function startServer() {
  await recoverJobs();
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

setInterval(monitorJobs, 5000);

startServer().catch(console.error);

