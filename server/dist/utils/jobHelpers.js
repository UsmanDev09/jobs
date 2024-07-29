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
import axios from 'axios';
import { DATABASE_DIR } from '../constants/index.js';
import { imageQueue } from '../jobs/imageQueue.js';
export const getRandomDelay = () => {
    const minDelay = 5;
    const maxDelay = 40;
    const step = 5;
    const possibleDelays = [];
    for (let delay = minDelay; delay <= maxDelay; delay += step) {
        possibleDelays.push(delay);
    }
    const randomIndex = Math.floor(Math.random() * possibleDelays.length);
    return possibleDelays[randomIndex];
};
export const getRemainingTime = (job) => {
    const now = Date.now();
    if (now >= job.endTime) {
        return 0;
    }
    return Math.round((job.endTime - now) / 1000);
};
export const fetchImage = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(`${process.env.UNSPLASH_URL}/photos/random`, {
            params: { client_id: process.env.UNSPLASH_ACCESS_KEY },
            timeout: 3000
        });
        return response.data.urls.raw;
    }
    catch (error) {
        console.error('Error fetching image:', error.message);
        return null;
    }
});
export const recoverJobs = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filenames = yield fs.readdir(DATABASE_DIR);
        for (const filename of filenames) {
            const jobData = yield fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
            const jsonData = JSON.parse(jobData);
            if (jsonData.state !== 'completed' && jsonData.state !== 'failed') {
                console.log(`Recovering job ${jsonData.id}`);
                yield imageQueue.add({}, {
                    jobId: jsonData.id,
                    attempts: jsonData.maxRetries - jsonData.retryAttempts,
                    backoff: {
                        type: 'exponential',
                        delay: 10
                    },
                });
            }
        }
    }
    catch (err) {
        console.error('Failed to recover jobs:', err);
    }
});
export const monitorJobs = () => __awaiter(void 0, void 0, void 0, function* () {
    const filenames = yield fs.readdir(DATABASE_DIR);
    for (const filename of filenames) {
        const jobData = yield fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
        const jsonData = JSON.parse(jobData);
        if (jsonData.state !== 'completed' && jsonData.state !== 'failed') {
            console.log(`Job ${jsonData.id} - State: ${jsonData.state}, Remaining time: ${getRemainingTime(jsonData)} seconds`);
        }
    }
});
//# sourceMappingURL=jobHelpers.js.map