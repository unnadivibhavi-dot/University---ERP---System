async function getLecturerProfile(req, res) {
    res.json({
        message: "Lecturer profile endpoint is working",
        data: {}
    });
}

async function getDashboardSummary(req, res) {
    res.json({
        message: "Lecturer dashboard summary endpoint is working",
        data: {
            assignedCourses: 0,
            totalStudents: 0,
            upcomingExaminations: 0,
            attendanceRecordsToday: 0
        }
    });
}

async function getLecturerCourses(req, res) {
    res.json({
        message: "Lecturer courses endpoint is working",
        data: []
    });
}

async function getCourseStudents(req, res) {
    res.json({
        message: "Course students endpoint is working",
        data: []
    });
}

async function getAttendance(req, res) {
    res.json({
        message: "Attendance endpoint is working",
        data: []
    });
}

async function markAttendance(req, res) {
    const {
        studentId,
        courseId,
        attendanceDate,
        status
    } = req.body;

    if (!studentId || !courseId || !attendanceDate || !status) {
        return res.status(400).json({
            message: "Student, course, attendance date and status are required"
        });
    }

    const allowedStatuses = ["Present", "Absent", "Late"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Status must be Present, Absent or Late"
        });
    }

    res.status(201).json({
        message: "Attendance endpoint is working",
        data: {
            studentId,
            courseId,
            attendanceDate,
            status
        }
    });
}

async function getExaminations(req, res) {
    res.json({
        message: "Examinations endpoint is working",
        data: []
    });
}

async function createExamination(req, res) {
    const {
        courseId,
        examinationName,
        examinationDate
    } = req.body;

    if (!courseId || !examinationName || !examinationDate) {
        return res.status(400).json({
            message: "Course, examination name and examination date are required"
        });
    }

    res.status(201).json({
        message: "Examination endpoint is working",
        data: {
            courseId,
            examinationName,
            examinationDate
        }
    });
}

async function getResults(req, res) {
    res.json({
        message: "Results endpoint is working",
        data: []
    });
}

async function addResult(req, res) {
    const {
        examinationId,
        studentId,
        marks
    } = req.body;

    if (
        examinationId === undefined ||
        studentId === undefined ||
        marks === undefined
    ) {
        return res.status(400).json({
            message: "Examination, student and marks are required"
        });
    }

    const numericMarks = Number(marks);

    if (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > 100
    ) {
        return res.status(400).json({
            message: "Marks must be between 0 and 100"
        });
    }

    res.status(201).json({
        message: "Result endpoint is working",
        data: {
            examinationId,
            studentId,
            marks: numericMarks
        }
    });
}

module.exports = {
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
};