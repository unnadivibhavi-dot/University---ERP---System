const { sql, getPool } = require("../config/db");

const getStudents = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                StudentID,
                RegistrationNumber,
                FullName,
                Email,
                Phone,
                Department,
                AcademicYear
            FROM Students
            ORDER BY StudentID;
        `);

        res.status(200).json({
            success: true,
            message: "Students retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get students error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
};

const getStudentById = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("studentId", sql.Int, req.params.id)
            .query(`
                SELECT
                    StudentID,
                    RegistrationNumber,
                    FullName,
                    Email,
                    Phone,
                    Department,
                    AcademicYear
                FROM Students
                WHERE StudentID = @studentId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Get student by ID error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student"
        });
    }
};

const createStudent = async (req, res) => {
    try {
        const {
            registrationNumber,
            fullName,
            email,
            phone,
            department,
            academicYear
        } = req.body;

        if (!registrationNumber || !fullName || !email || !department || !academicYear) {
            return res.status(400).json({
                success: false,
                message: "registrationNumber, fullName, email, department and academicYear are required"
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input("registrationNumber", sql.NVarChar, registrationNumber)
            .input("fullName", sql.NVarChar, fullName)
            .input("email", sql.NVarChar, email)
            .input("phone", sql.NVarChar, phone || null)
            .input("department", sql.NVarChar, department)
            .input("academicYear", sql.Int, academicYear)
            .query(`
                INSERT INTO Students (
                    RegistrationNumber,
                    FullName,
                    Email,
                    Phone,
                    Department,
                    AcademicYear
                )
                OUTPUT
                    INSERTED.StudentID,
                    INSERTED.RegistrationNumber,
                    INSERTED.FullName,
                    INSERTED.Email,
                    INSERTED.Phone,
                    INSERTED.Department,
                    INSERTED.AcademicYear
                VALUES (
                    @registrationNumber,
                    @fullName,
                    @email,
                    @phone,
                    @department,
                    @academicYear
                );
            `);

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Create student error:", error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "Registration number or email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const {
            registrationNumber,
            fullName,
            email,
            phone,
            department,
            academicYear
        } = req.body;

        if (!registrationNumber || !fullName || !email || !department || !academicYear) {
            return res.status(400).json({
                success: false,
                message: "registrationNumber, fullName, email, department and academicYear are required"
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input("studentId", sql.Int, req.params.id)
            .input("registrationNumber", sql.NVarChar, registrationNumber)
            .input("fullName", sql.NVarChar, fullName)
            .input("email", sql.NVarChar, email)
            .input("phone", sql.NVarChar, phone || null)
            .input("department", sql.NVarChar, department)
            .input("academicYear", sql.Int, academicYear)
            .query(`
                UPDATE Students
                SET
                    RegistrationNumber = @registrationNumber,
                    FullName = @fullName,
                    Email = @email,
                    Phone = @phone,
                    Department = @department,
                    AcademicYear = @academicYear
                OUTPUT
                    INSERTED.StudentID,
                    INSERTED.RegistrationNumber,
                    INSERTED.FullName,
                    INSERTED.Email,
                    INSERTED.Phone,
                    INSERTED.Department,
                    INSERTED.AcademicYear
                WHERE StudentID = @studentId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Update student error:", error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "Registration number or email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};

const deleteStudent = async (req, res) => {
    let transaction;

    try {
        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const pool = getPool();

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Find the student and the connected login account.
        const studentResult = await new sql.Request(transaction)
            .input("studentId", sql.Int, studentId)
            .query(`
                SELECT UserID
                FROM Students
                WHERE StudentID = @studentId;
            `);

        if (studentResult.recordset.length === 0) {
            await transaction.rollback();
            transaction = null;

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const userId = studentResult.recordset[0].UserID;

        // Remove only records belonging to this student.
        await new sql.Request(transaction)
            .input("studentId", sql.Int, studentId)
            .query(`
                DELETE FROM Attendance
                WHERE StudentID = @studentId;

                DELETE FROM Results
                WHERE StudentID = @studentId;

                DELETE FROM Enrollments
                WHERE StudentID = @studentId;

                DELETE FROM Students
                WHERE StudentID = @studentId;
            `);

        // Remove the connected student login account when it is not used elsewhere.
        if (userId !== null && userId !== undefined) {
            await new sql.Request(transaction)
                .input("userId", sql.Int, userId)
                .query(`
                    DELETE FROM Users
                    WHERE UserID = @userId
                      AND Role = 'Student'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM Students
                          WHERE UserID = @userId
                      )
                      AND NOT EXISTS (
                          SELECT 1
                          FROM Lecturers
                          WHERE UserID = @userId
                      );
                `);
        }

        await transaction.commit();
        transaction = null;

        res.status(200).json({
            success: true,
            message: "Student and related records deleted successfully"
        });
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Student deletion rollback error:", rollbackError.message);
            }
        }

        console.error("Delete student error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};
