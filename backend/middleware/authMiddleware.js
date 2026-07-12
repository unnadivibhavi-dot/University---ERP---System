const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const parts = authorizationHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0].toLowerCase() !== "bearer"
        ) {
            return res.status(401).json({
                success: false,
                message: "Use Bearer token authentication"
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
}

module.exports = authenticateToken;