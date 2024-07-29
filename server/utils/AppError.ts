export class AppError extends Error {
    statusCode: number;
    details: {};
    constructor(message: string, statusCode: number, details = {}) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
    }
  }
  
