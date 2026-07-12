function requireStudentRole(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication is required"
        });
    }

    const role = String(req.user.role || "").toLowerCase();

    if (role !== "student") {
        return res.status(403).json({
            success: false,
            message: "Student access is required"
        });
    }

    next();
}

module.exports = requireStudentRole;