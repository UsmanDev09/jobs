import express from 'express';
import { createJob, getAllJobs, getJob } from '../controllers/jobs.js';
const router = express.Router();
router.post('/', createJob);
router.get('/', getAllJobs);
router.get('/:jobId', getJob);
export default router;
//# sourceMappingURL=jobs.js.map