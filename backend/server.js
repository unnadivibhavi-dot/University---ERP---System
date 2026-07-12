const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const resultRoutes = require("./routes/resultRoutes");
const authRoutes = require("./routes/authRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");

// Student Portal routes
const studentPortalRoutes = require("./routes/studentPortalRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "University ERP Backend Running"
    });
});

// Shared authentication
app.use("/api/auth", authRoutes);

// Administrator and common routes
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/examinations", examinationRoutes);
app.use("/api/results", resultRoutes);

// Lecturer Portal
app.use("/api/lecturer", lecturerRoutes);

// Student Portal
app.use("/api/student-portal", studentPortalRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(
            "Server did not start because the database connection failed"
        );
        console.error(error.message);
        process.exit(1);
    });