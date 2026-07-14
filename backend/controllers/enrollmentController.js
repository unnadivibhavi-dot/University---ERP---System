const { sql, getPool } = require("../config/db");

const getEnrollments = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                e.EnrollmentID,
                e.StudentID,
                s.RegistrationNumber,
                s.FullName,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                e.EnrollmentDate
            FROM Enrollments e
            INNER JOIN Students s ON e.StudentID = s.StudentID
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            ORDER BY e.EnrollmentID;
        `);

        res.status(200).json({
            success: true,
            message: "Enrollments retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get enrollments error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve enrollments"
        });
    }
};

const getEnrollmentById = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("enrollmentId", sql.Int, req.params.id)
            .query(`
                SELECT
                    e.EnrollmentID,
                    e.StudentID,
                    s.RegistrationNumber,
                    s.FullName,
                    e.CourseID,
                    c.CourseCode,
                    c.CourseName,
                    e.EnrollmentDate
                FROM Enrollments e
                INNER JOIN Students s ON e.StudentID = s.StudentID
                INNER JOIN Courses c ON e.CourseID = c.CourseID
                WHERE e.EnrollmentID = @enrollmentId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Enrollment retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Get enrollment by ID error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve enrollment"
        });
    }
};

const createEnrollment = async (req, res) => {
    try {
        const { studentId, courseId, enrollmentDate } = req.body;

        if (!studentId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "studentId and courseId are required"
            });
        }

        const finalEnrollmentDate = enrollmentDate
            ? new Date(enrollmentDate)
            : new Date();

        const pool = getPool();

        const result = await pool.request()
            .input("studentId", sql.Int, studentId)
            .input("courseId", sql.Int, courseId)
            .input("enrollmentDate", sql.Date, finalEnrollmentDate)
            .query(`
                INSERT INTO Enrollments (
                    StudentID,
                    CourseID,
                    EnrollmentDate
                )
                OUTPUT
                    INSERTED.EnrollmentID,
                    INSERTED.StudentID,
                    INSERTED.CourseID,
                    INSERTED.EnrollmentDate
                VALUES (
                    @studentId,
                    @courseId,
                    @enrollmentDate
                );
            `);

        res.status(201).json({
            success: true,
            message: "Enrollment created successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Create enrollment error:", error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "This student is already enrolled in this course"
            });
        }

        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                message: "Invalid studentId or courseId"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create enrollment"
        });
    }
};

const deleteEnrollment = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("enrollmentId", sql.Int, req.params.id)
            .query(`
                DELETE FROM Enrollments
                WHERE EnrollmentID = @enrollmentId;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Enrollment deleted successfully"
        });
    } catch (error) {
        console.error("Delete enrollment error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete enrollment"
        });
    }
};

module.exports = {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    deleteEnrollment
};
