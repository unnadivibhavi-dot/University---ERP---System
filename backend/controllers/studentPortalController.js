const { sql, getPool } = require("../config/db");

const getStudentByUserId = async (pool, userId) => {
    const result = await pool.request()
        .input("userId", sql.Int, userId)
        .query(`
            SELECT
                StudentID,
                UserID,
                RegistrationNumber,
                FullName,
                Email,
                Phone,
                Department,
                AcademicYear
            FROM Students
            WHERE UserID = @userId;
        `);

    return result.recordset[0];
};

const handleMissingStudent = (res) => {
    return res.status(404).json({
        success: false,
        message: "Student profile is not linked to this user account"
    });
};

async function getDashboard(req, res) {
    try {
        const pool = getPool();
        const student = await getStudentByUserId(pool, req.user.userId);

        if (!student) {
            return handleMissingStudent(res);
        }

        const result = await pool.request()
            .input("studentId", sql.Int, student.StudentID)
            .query(`
                SELECT
                    (SELECT COUNT(*)
                     FROM Enrollments
                     WHERE StudentID = @studentId) AS totalCourses,

                    (SELECT COUNT(*)
                     FROM Attendance
                     WHERE StudentID = @studentId) AS attendanceRecords,

                    (SELECT COUNT(*)
                     FROM Examinations ex
                     INNER JOIN Enrollments e
                        ON ex.CourseID = e.CourseID
                     WHERE e.StudentID = @studentId
                       AND ex.ExaminationDate >= CAST(GETDATE() AS DATE)) AS upcomingExaminations,

                    (SELECT COUNT(*)
                     FROM Results
                     WHERE StudentID = @studentId) AS publishedResults;
            `);

        res.status(200).json({
            success: true,
            message: "Student dashboard retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Student dashboard error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student dashboard"
        });
    }
}

async function getProfile(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("userId", sql.Int, req.user.userId)
            .query(`
                SELECT
                    s.StudentID,
                    s.UserID,
                    u.Username,
                    u.Role,
                    s.RegistrationNumber,
                    s.FullName,
                    s.Email,
                    s.Phone,
                    s.Department,
                    s.AcademicYear
                FROM Students s
                INNER JOIN Users u ON s.UserID = u.UserID
                WHERE s.UserID = @userId;
            `);

        if (result.recordset.length === 0) {
            return handleMissingStudent(res);
        }

        res.status(200).json({
            success: true,
            message: "Student profile retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Student profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student profile"
        });
    }
}

async function getCourses(req, res) {
    try {
        const pool = getPool();
        const student = await getStudentByUserId(pool, req.user.userId);

        if (!student) {
            return handleMissingStudent(res);
        }

        const result = await pool.request()
            .input("studentId", sql.Int, student.StudentID)
            .query(`
                SELECT
                    c.CourseID,
                    c.CourseCode,
                    c.CourseName,
                    c.Credits,
                    c.Department,
                    e.EnrollmentID,
                    e.EnrollmentDate
                FROM Enrollments e
                INNER JOIN Courses c ON e.CourseID = c.CourseID
                WHERE e.StudentID = @studentId
                ORDER BY c.CourseCode;
            `);

        res.status(200).json({
            success: true,
            message: "Student courses retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Student courses error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student courses"
        });
    }
}

async function getAttendance(req, res) {
    try {
        const pool = getPool();
        const student = await getStudentByUserId(pool, req.user.userId);

        if (!student) {
            return handleMissingStudent(res);
        }

        const result = await pool.request()
            .input("studentId", sql.Int, student.StudentID)
            .query(`
                SELECT
                    a.AttendanceID,
                    a.CourseID,
                    c.CourseCode,
                    c.CourseName,
                    a.AttendanceDate,
                    a.Status
                FROM Attendance a
                INNER JOIN Courses c ON a.CourseID = c.CourseID
                WHERE a.StudentID = @studentId
                ORDER BY a.AttendanceDate DESC, c.CourseCode;
            `);

        res.status(200).json({
            success: true,
            message: "Student attendance retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Student attendance error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student attendance"
        });
    }
}

async function getExaminations(req, res) {
    try {
        const pool = getPool();
        const student = await getStudentByUserId(pool, req.user.userId);

        if (!student) {
            return handleMissingStudent(res);
        }

        const result = await pool.request()
            .input("studentId", sql.Int, student.StudentID)
            .query(`
                SELECT
                    ex.ExaminationID,
                    ex.CourseID,
                    c.CourseCode,
                    c.CourseName,
                    ex.ExaminationName,
                    ex.ExaminationDate
                FROM Examinations ex
                INNER JOIN Courses c ON ex.CourseID = c.CourseID
                INNER JOIN Enrollments e ON c.CourseID = e.CourseID
                WHERE e.StudentID = @studentId
                ORDER BY ex.ExaminationDate;
            `);

        res.status(200).json({
            success: true,
            message: "Student examinations retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Student examinations error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student examinations"
        });
    }
}

async function getResults(req, res) {
    try {
        const pool = getPool();
        const student = await getStudentByUserId(pool, req.user.userId);

        if (!student) {
            return handleMissingStudent(res);
        }

        const result = await pool.request()
            .input("studentId", sql.Int, student.StudentID)
            .query(`
                SELECT
                    r.ResultID,
                    r.ExaminationID,
                    ex.ExaminationName,
                    ex.ExaminationDate,
                    c.CourseID,
                    c.CourseCode,
                    c.CourseName,
                    r.Marks,
                    r.Grade
                FROM Results r
                INNER JOIN Examinations ex ON r.ExaminationID = ex.ExaminationID
                INNER JOIN Courses c ON ex.CourseID = c.CourseID
                WHERE r.StudentID = @studentId
                ORDER BY ex.ExaminationDate DESC;
            `);

        res.status(200).json({
            success: true,
            message: "Student results retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Student results error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student results"
        });
    }
}

module.exports = {
    getDashboard,
    getProfile,
    getCourses,
    getAttendance,
    getExaminations,
    getResults
};
