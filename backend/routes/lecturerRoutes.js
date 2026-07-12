const express = require("express");

const {
    getLecturerProfile,
    getDashboardSummary,
    getLecturerCourses,
    getCourseStudents,
    getAttendance,
    markAttendance,
    getExaminations,
    createExamination,
    getResults,
    addResult
} = require("../controllers/lecturerController");

const router = express.Router();

router.get("/profile", getLecturerProfile);
router.get("/dashboard-summary", getDashboardSummary);
router.get("/courses", getLecturerCourses);
router.get("/courses/:courseId/students", getCourseStudents);

router.get("/attendance/:courseId", getAttendance);
router.post("/attendance", markAttendance);

router.get("/examinations", getExaminations);
router.post("/examinations", createExamination);

router.get("/results/:examinationId", getResults);
router.post("/results", addResult);

module.exports = router;