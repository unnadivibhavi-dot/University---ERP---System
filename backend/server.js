const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const resultRoutes = require("./routes/resultRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const resultRoutes = require("./routes/resultRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "University ERP Backend Running"
    });
});

app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/examinations", examinationRoutes);
app.use("/api/results", resultRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/examinations", examinationRoutes);
app.use("/api/results", resultRoutes);

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});