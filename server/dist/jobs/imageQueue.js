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
import path from 'path';
import Queue from 'bull';
import { DATABASE_DIR } from '../constants/index.js';
import { fetchImage, getRemainingTime } from '../utils/jobHelpers.js';
import { jobEventEmitter } from '../socket/socketHandler.js';
export const imageQueue = new Queue('image-processing', process.env.REDIS_URL, {
    redis: {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    },
    //@ts-ignore
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000
    },
    settings: {
        stalledInterval: 60 * 5 * 1000,
    },
    concurrency: 5,
});
imageQueue.process((jobItem) => __awaiter(void 0, void 0, void 0, function* () {
    let updatedJobData;
    let jsonData;
    try {
        const jobData = yield fs.readFile(`${DATABASE_DIR}/${jobItem.id}.json`, 'utf-8');
        jsonData = JSON.parse(jobData);
        const imageUrl = yield fetchImage();
        console.log('jobid', jobItem.id, imageUrl);
        if (imageUrl) {
            updatedJobData = Object.assign(Object.assign({}, jsonData), { imageUrl, state: 'completed' });
        }
        else {
            updatedJobData = Object.assign(Object.assign({}, jsonData), { state: 'retrying', retryAttempts: (jsonData.retryAttempts || 0) + 1 });
            yield fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));
            jobEventEmitter.emit('jobUpdated', updatedJobData);
            throw new Error('Image fetch failed, retrying...');
        }
        yield fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));
        jobEventEmitter.emit('jobUpdated', updatedJobData);
        console.log('emitting');
    }
    catch (error) {
        console.error('Error processing job:', error);
        if (updatedJobData.retryAttempts >= jsonData.maxRetries) {
            updatedJobData = Object.assign(Object.assign({}, updatedJobData), { state: 'failed' });
            yield fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));
            jobEventEmitter.emit('jobUpdated', updatedJobData);
        }
        throw error;
    }
}));
imageQueue.on('failed', (job, err) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} failed with error ${err.message}`);
    const jobData = yield fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
    const jsonData = JSON.parse(jobData);
    if (jsonData.state !== 'retrying') {
        jsonData.state = 'failed';
        yield fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jsonData));
        jobEventEmitter.emit('jobUpdated', jsonData);
    }
    if (jsonData.state === 'retrying' && job.attemptsMade < jsonData.maxRetries) {
        console.log(`Retrying job ${job.id}, attempt ${job.attemptsMade + 1}`);
        yield job.retry();
    }
}));
imageQueue.on('completed', (job, result) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} completed`);
    const jobData = yield fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
    const jsonData = JSON.parse(jobData);
    if (jsonData.state !== 'completed') {
        jsonData.state = 'completed';
        yield fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jsonData));
        jobEventEmitter.emit('jobUpdated', jsonData);
    }
}));
imageQueue.on('stalled', (job) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} has stalled`);
    try {
        const jobData = yield fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
        const jsonData = JSON.parse(jobData);
        console.log(`Stalled job ${job.id} details:`, jsonData);
        console.log(`Remaining time when stalled: ${getRemainingTime(jsonData)} seconds`);
        jsonData.state = 'stalled';
        yield fs.writeFile(path.join(DATABASE_DIR, `${job.id}.json`), JSON.stringify(jsonData));
        jobEventEmitter.emit('jobUpdated', jsonData);
    }
    catch (error) {
        console.error(`Error handling stalled job ${job.id}:`, error);
    }
}));
//# sourceMappingURL=imageQueue.js.map