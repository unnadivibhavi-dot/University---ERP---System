const notFound = (req, res, next) => {
    res.status(404).json({
        message: `Route not found: ${req.originalUrl}`
    });
};

const errorHandler = (error, req, res, next) => {
    console.error(error);

    res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
    });
};

module.exports = {
    notFound,
    errorHandler
};