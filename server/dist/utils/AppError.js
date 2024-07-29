export class AppError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
//# sourceMappingURL=AppError.js.map