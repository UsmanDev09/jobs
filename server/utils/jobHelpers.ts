import fs from 'fs/promises';
import axios from 'axios';
import { DATABASE_DIR } from '../constants/index.js';
import { imageQueue } from '../jobs/imageQueue.js';
import { Job } from '../types/job.js';

export const getRandomDelay = () => {
  const minDelay = 5;
  const maxDelay = 40;
  const step = 5;
  const possibleDelays: number[] = [];

  for (let delay = minDelay; delay <= maxDelay; delay += step) {
    possibleDelays.push(delay);
  }

  const randomIndex = Math.floor(Math.random() * possibleDelays.length);
  return possibleDelays[randomIndex];
};

export const getRemainingTime = (job: Job) => {
  const now = Date.now();
  if (now >= job.endTime) {
    return 0;
  }
  return Math.round((job.endTime - now) / 1000);
};

export const fetchImage = async () => {
  try {
    const response = await axios.get(`${process.env.UNSPLASH_URL}/photos/random`, {
      params: { client_id: process.env.UNSPLASH_ACCESS_KEY },
      timeout: 3000
    });
    return response.data.urls.raw;
  } catch (error) {
    if(error instanceof Error) console.error('Error fetching image:', error.message);
    
    return null;
  }
};

export const recoverJobs = async () => {
  try {
    const filenames = await fs.readdir(DATABASE_DIR);
    for (const filename of filenames) {
      const jobData = await fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
      const jsonData = JSON.parse(jobData);
      if (jsonData.state !== 'completed' && jsonData.state !== 'failed') {
        console.log(`Recovering job ${jsonData.id}`);
        await imageQueue.add({}, {
          jobId: jsonData.id,
          attempts: jsonData.maxRetries - jsonData.retryAttempts,
          backoff: {
            type: 'exponential',
            delay: 10
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to recover jobs:', err);
  }
};

export const monitorJobs = async () => {
  const filenames = await fs.readdir(DATABASE_DIR);
  for (const filename of filenames) {
    const jobData = await fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
    const jsonData = JSON.parse(jobData);
    
    if (jsonData.state !== 'completed' && jsonData.state !== 'failed') {
      console.log(`Job ${jsonData.id} - State: ${jsonData.state}, Remaining time: ${getRemainingTime(jsonData)} seconds`);
    }
  }
};