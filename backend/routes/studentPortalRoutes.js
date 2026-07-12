const express = require("express");

const authenticateToken =
    require("../middleware/authMiddleware");

const requireStudentRole =
    require("../middleware/studentRoleMiddleware");

const {
    getDashboard,
    getProfile,
    getCourses,
    getAttendance,
    getExaminations,
    getResults
} = require("../controllers/studentPortalController");

const router = express.Router();

router.use(authenticateToken);
router.use(requireStudentRole);

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.get("/courses", getCourses);
router.get("/attendance", getAttendance);
router.get("/examinations", getExaminations);
router.get("/results", getResults);

module.exports = router;