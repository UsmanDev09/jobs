import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import { DATABASE_DIR } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { getRandomDelay, getRemainingTime, fetchImage } from '../utils/jobHelpers.js';
import { jobEventEmitter } from '../socket/socketHandler.js';
import { imageQueue } from '../jobs/imageQueue.js';

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delay = getRandomDelay();
    const startTime = Date.now();
    const endTime = startTime + delay * 1000;
    const job = await imageQueue.add({}, { 
      delay: delay * 1000,
    });
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

    await fs.writeFile(`${DATABASE_DIR}/${job.id}.json`, JSON.stringify(jobData))
    res.json({ jobId: job.id, estimatedDelay: delay });
  } catch (err) {
    if(err instanceof Error)
      next(new AppError('Failed to create job', 500, { originalError: err.message }));
  }
};

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filenames = await fs.readdir(DATABASE_DIR);
    const jobs = await Promise.all(filenames.map(async (filename) => {
      const jobData = await fs.readFile(`${DATABASE_DIR}/${filename}`, 'utf-8');
      return JSON.parse(jobData);
    }));
    res.status(200).json(jobs);
  } catch (err) {
    if(err instanceof Error)
      next(new AppError('Failed to fetch jobs', 500, { originalError: err.message }));
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobData = await fs.readFile(`${DATABASE_DIR}/${req.params.jobId}.json`, 'utf-8');
    const json = JSON.parse(jobData);

    if (json) {
      res.json(json);
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (err) {
    if(err instanceof Error)
      next(new AppError('Failed to fetch job', 500, { originalError: err.message }));
  }
};

