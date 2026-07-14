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
    try {
        const pool = getPool();

        const result = await pool.request()
            .input("courseId", sql.Int, req.params.id)
            .query(`
                DELETE FROM Courses
                WHERE CourseID = @courseId;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        console.error("Delete course error:", error.message);

        if (error.number === 547) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this course because it is used by enrollments, attendance, examinations or lecturer assignments"
            });
        }

        res.status(500).json({
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
