const express = require("express");
const router = express.Router();

const {
    getAllAttendance,
    getAttendanceById,
    getAttendanceByStudent,
    createAttendance,
    updateAttendance,
    deleteAttendance
} = require("../controllers/attendanceController");

router.get("/student/:studentId", getAttendanceByStudent);
router.get("/", getAllAttendance);
router.get("/:id", getAttendanceById);
router.post("/", createAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

module.exports = router;
