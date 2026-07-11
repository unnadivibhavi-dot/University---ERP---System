const express = require("express");

const {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    deleteEnrollment
} = require("../controllers/enrollmentController");

const router = express.Router();

router.get("/", getEnrollments);
router.get("/:id", getEnrollmentById);
router.post("/", createEnrollment);
router.delete("/:id", deleteEnrollment);

module.exports = router;