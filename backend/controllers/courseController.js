const { sql, getPool } = require("../config/db");

const getCourses = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT CourseID, CourseCode, CourseName, Credits, Department
            FROM Courses
            ORDER BY CourseID;
        `);

        res.status(200).json({
            success: true,
            message: "Courses retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get courses error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve courses"
        });
    }
};

const getCourseById = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("courseId", sql.Int, req.params.id)
            .query(`
                SELECT CourseID, CourseCode, CourseName, Credits, Department
                FROM Courses
                WHERE CourseID = @courseId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Get course by ID error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve course"
        });
    }
};

const createCourse = async (req, res) => {
    try {
        const { courseCode, courseName, credits, department } = req.body;

        if (!courseCode || !courseName || !credits || !department) {
            return res.status(400).json({
                success: false,
                message: "courseCode, courseName, credits and department are required"
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input("courseCode", sql.NVarChar, courseCode)
            .input("courseName", sql.NVarChar, courseName)
            .input("credits", sql.Int, credits)
            .input("department", sql.NVarChar, department)
            .query(`
                INSERT INTO Courses (CourseCode, CourseName, Credits, Department)
                OUTPUT INSERTED.CourseID, INSERTED.CourseCode, INSERTED.CourseName, INSERTED.Credits, INSERTED.Department
                VALUES (@courseCode, @courseName, @credits, @department);
            `);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Create course error:", error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "Course code already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create course"
        });
    }
};

const updateCourse = async (req, res) => {
    try {
        const { courseCode, courseName, credits, department } = req.body;

        if (!courseCode || !courseName || !credits || !department) {
            return res.status(400).json({
                success: false,
                message: "courseCode, courseName, credits and department are required"
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input("courseId", sql.Int, req.params.id)
            .input("courseCode", sql.NVarChar, courseCode)
            .input("courseName", sql.NVarChar, courseName)
            .input("credits", sql.Int, credits)
            .input("department", sql.NVarChar, department)
            .query(`
                UPDATE Courses
                SET
                    CourseCode = @courseCode,
                    CourseName = @courseName,
                    Credits = @credits,
                    Department = @department
                OUTPUT INSERTED.CourseID, INSERTED.CourseCode, INSERTED.CourseName, INSERTED.Credits, INSERTED.Department
                WHERE CourseID = @courseId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Update course error:", error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "Course code already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update course"
        });
    }
};

const deleteCourse = async (req, res) => {
    let transaction;

    try {
        const courseId = Number(req.params.id);

        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        const pool = getPool();

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Confirm that the course exists.
        const courseResult = await new sql.Request(transaction)
            .input("courseId", sql.Int, courseId)
            .query(`
                SELECT CourseID
                FROM Courses
                WHERE CourseID = @courseId;
            `);

        if (courseResult.recordset.length === 0) {
            await transaction.rollback();
            transaction = null;

            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Delete results connected to examinations belonging to this course.
        await new sql.Request(transaction)
            .input("courseId", sql.Int, courseId)
            .query(`
                DELETE FROM Results
                WHERE ExaminationID IN (
                    SELECT ExaminationID
                    FROM Examinations
                    WHERE CourseID = @courseId
                );
            `);

        // Delete all direct records connected to this course.
        await new sql.Request(transaction)
            .input("courseId", sql.Int, courseId)
            .query(`
                DELETE FROM Examinations
                WHERE CourseID = @courseId;

                DELETE FROM Attendance
                WHERE CourseID = @courseId;

                DELETE FROM Enrollments
                WHERE CourseID = @courseId;

                DELETE FROM LecturerCourses
                WHERE CourseID = @courseId;

                DELETE FROM Courses
                WHERE CourseID = @courseId;
            `);

        await transaction.commit();
        transaction = null;

        return res.status(200).json({
            success: true,
            message: "Course and related records deleted successfully"
        });
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Course deletion rollback error:",
                    rollbackError.message
                );
            }
        }

        console.error("Delete course error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete course"
        });
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};
