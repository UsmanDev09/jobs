import { Request, Response, NextFunction } from 'express';


interface CustomError extends Error {
  statusCode?: number;
  details?: Record<string, unknown>;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Error occurred',
      details: err.details || {}
    }
  });
}