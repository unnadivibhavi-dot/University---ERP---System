const express = require("express");

const router = express.Router();

const {
    getEnrollments
} = require("../controllers/enrollmentController");

router.get("/", getEnrollments);

module.exports = router;