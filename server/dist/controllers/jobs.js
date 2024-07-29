var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs/promises';
import { DATABASE_DIR } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { getRandomDelay } from '../utils/jobHelpers.js';
import { jobEventEmitter } from '../socket/socketHandler.js';
import { imageQueue } from '../jobs/imageQueue.js';
export const createJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const delay = getRandomDelay();
        const startTime = Date.now();
        const endTime = startTime + delay * 1000;
        const job = yield imageQueue.add({}, { delay: delay * 1000 });
        const jobData = {
            id: job.id,
            state: 'waiting',
            delay: delay,
            startTime: startTime,
            endTime: endTime,
            imageUrl: null,
            createdAt: new Date().toISOString(),
            maxRetries: 3,
            retryAttempts: 0
        };
        jobEventEmitter.emit('jobUpdated', jobData);
        yield fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jobData));
        res.json({ jobId: job.id, estimatedDelay: delay });
    }
    catch (err) {
        next(new AppError('Failed to create job', 500, { originalError: err.message }));
    }
});
export const getAllJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filenames = yield fs.readdir(DATABASE_DIR);
        const jobs = yield Promise.all(filenames.map((filename) => __awaiter(void 0, void 0, void 0, function* () {
            const jobData = yield fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
            return JSON.parse(jobData);
        })));
        res.status(200).json(jobs);
    }
    catch (err) {
        next(new AppError('Failed to fetch jobs', 500, { originalError: err.message }));
    }
});
export const getJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobData = yield fs.readFile(`${DATABASE_DIR}/${req.params.jobId}.json`, 'utf-8');
        const json = JSON.parse(jobData);
        if (json) {
            res.json(json);
        }
        else {
            res.status(404).json({ error: 'Job not found' });
        }
    }
    catch (err) {
        next(new AppError('Failed to fetch job', 500, { originalError: err.message }));
    }
});
//# sourceMappingURL=jobs.js.map