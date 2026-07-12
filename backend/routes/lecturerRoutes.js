const express = require("express");

const authenticateToken =
    require("../middleware/authMiddleware");

const allowRoles =
    require("../middleware/roleMiddleware");

const {
    getLecturerProfile,
    getDashboardSummary,
    getLecturerCourses,
    getCourseStudents,
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    getExaminations,
    createExamination,
    updateExamination,
    getResults,
    addResult,
    updateResult
} = require("../controllers/lecturerController");

const router = express.Router();

router.use(authenticateToken);
router.use(allowRoles("Lecturer"));

router.get("/profile", getLecturerProfile);
router.get("/dashboard-summary", getDashboardSummary);
router.get("/courses", getLecturerCourses);
router.get("/courses/:courseId/students", getCourseStudents);

router.get("/attendance/:courseId", getAttendance);
router.post("/attendance", markAttendance);
router.put(
    "/attendance/:attendanceId",
    updateAttendance
);
router.delete(
    "/attendance/:attendanceId",
    deleteAttendance
);

router.get("/examinations", getExaminations);
router.post("/examinations", createExamination);
router.put(
    "/examinations/:examinationId",
    updateExamination
);

router.get("/results/:examinationId", getResults);
router.post("/results", addResult);
router.put("/results/:resultId", updateResult);

module.exports = router;