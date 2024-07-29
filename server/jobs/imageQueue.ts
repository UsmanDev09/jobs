import fs from 'fs/promises';
import path from 'path';
import Queue from 'bull';
import { DATABASE_DIR } from '../constants/index.js';
import { fetchImage, getRemainingTime } from '../utils/jobHelpers.js';
import { jobEventEmitter } from '../socket/socketHandler.js';

export const imageQueue = new Queue('image-processing', process.env.REDIS_URL!, {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
  settings: {
    stalledInterval: 60 * 5 * 1000,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});


imageQueue.process(async (jobItem) => {
  let updatedJobData;
  let jsonData;

  try {
    const jobData = await fs.readFile(`${DATABASE_DIR}/${jobItem.id}.json`, 'utf-8');
    jsonData = JSON.parse(jobData);

    const imageUrl = await fetchImage();
    console.log('jobid', jobItem.id, imageUrl);

    if (imageUrl) {
      updatedJobData = {
        ...jsonData,
        imageUrl,
        state: 'completed'
      };
    } else {
      updatedJobData = {
        ...jsonData,
        state: 'retrying',
        retryAttempts: (jsonData.retryAttempts || 0) + 1
      };
      
      await fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));
      
      jobEventEmitter.emit('jobUpdated', updatedJobData);
      
      throw new Error('Image fetch failed, retrying...');
    }

    await fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));

    jobEventEmitter.emit('jobUpdated', updatedJobData);
    console.log('emitting');
  } catch (error) {
    console.error('Error processing job:', error);
    
    if (updatedJobData.retryAttempts >= jsonData.maxRetries) {
      updatedJobData = {
        ...updatedJobData,
        state: 'failed'
      };
      await fs.writeFile(`${DATABASE_DIR}/${jobItem.id}.json`, JSON.stringify(updatedJobData));
      jobEventEmitter.emit('jobUpdated', updatedJobData);
    }
    
    throw error;
  }
});

imageQueue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
  const jobData = await fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
  const jsonData = JSON.parse(jobData);
  
  if (jsonData.state !== 'retrying') {
    jsonData.state = 'failed';
    await fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jsonData));
    jobEventEmitter.emit('jobUpdated', jsonData);
  }

  if (jsonData.state === 'retrying' && job.attemptsMade < jsonData.maxRetries) {
    console.log(`Retrying job ${job.id}, attempt ${job.attemptsMade + 1}`);
    await job.retry();
  }
});

imageQueue.on('completed', async (job, result) => {
  console.log(`Job ${job.id} completed`);
  const jobData = await fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
  const jsonData = JSON.parse(jobData);
  
  if (jsonData.state !== 'completed') {
    jsonData.state = 'completed';
    await fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jsonData));
    jobEventEmitter.emit('jobUpdated', jsonData);
  }
});

imageQueue.on('stalled', async (job) => {
  console.log(`Job ${job.id} has stalled`);
  try {
    const jobData = await fs.readFile(`${DATABASE_DIR}/${job.id}.json`, 'utf-8');
    const jsonData = JSON.parse(jobData);
    
    console.log(`Stalled job ${job.id} details:`, jsonData);
    console.log(`Remaining time when stalled: ${getRemainingTime(jsonData)} seconds`);

    jsonData.state = 'stalled';

    await fs.writeFile(path.join(DATABASE_DIR, `${job.id}.json`), JSON.stringify(jsonData));
    jobEventEmitter.emit('jobUpdated', jsonData);
  } catch (error) {
    console.error(`Error handling stalled job ${job.id}:`, error);
  }
});

