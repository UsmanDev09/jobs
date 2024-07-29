export const errorHandler = (err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        error: {
            message: err.message || 'Error occurred',
            details: err.details || {}
        }
    });
};
//# sourceMappingURL=errorHandler.js.map