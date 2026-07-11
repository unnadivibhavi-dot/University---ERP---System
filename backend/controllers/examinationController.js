const { sql } = require("../config/db");

const isPositiveInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
};

const isValidDate = (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
};

const getAllExaminations = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT
                e.ExaminationID,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                e.ExaminationName,
                e.ExaminationDate
            FROM Examinations e
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            ORDER BY e.ExaminationDate DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("getAllExaminations error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve examinations"
        });
    }
};

const getExaminationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Examination ID must be a positive integer"
            });
        }

        const request = new sql.Request();
        request.input("ExaminationID", sql.Int, Number(id));

        const result = await request.query(`
            SELECT
                e.ExaminationID,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                e.ExaminationName,
                e.ExaminationDate
            FROM Examinations e
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            WHERE e.ExaminationID = @ExaminationID
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Examination not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("getExaminationById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve examination"
        });
    }
};

const createExamination = async (req, res) => {
    try {
        const { courseId, examinationName, examinationDate } = req.body;

        if (!courseId || !examinationName || !examinationDate) {
            return res.status(400).json({
                success: false,
                message: "courseId, examinationName, and examinationDate are required"
            });
        }

        if (!isPositiveInteger(courseId)) {
            return res.status(400).json({
                success: false,
                message: "courseId must be a positive integer"
            });
        }

        if (typeof examinationName !== "string" || examinationName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "examinationName must be a non-empty string"
            });
        }

        if (!isValidDate(examinationDate)) {
            return res.status(400).json({
                success: false,
                message: "examinationDate must be a valid date"
            });
        }

        // Confirm course exists
        const courseRequest = new sql.Request();
        courseRequest.input("CourseID", sql.Int, Number(courseId));
        const courseResult = await courseRequest.query(
            "SELECT CourseID FROM Courses WHERE CourseID = @CourseID"
        );

        if (courseResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Prevent duplicate examination for same course, name, and date
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("CourseID", sql.Int, Number(courseId));
        duplicateRequest.input("ExaminationName", sql.NVarChar, examinationName.trim());
        duplicateRequest.input("ExaminationDate", sql.Date, examinationDate);
        const duplicateResult = await duplicateRequest.query(
            "SELECT ExaminationID FROM Examinations WHERE CourseID = @CourseID AND ExaminationName = @ExaminationName AND ExaminationDate = @ExaminationDate"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An examination with the same course, name, and date already exists"
            });
        }

        // Insert examination
        const insertRequest = new sql.Request();
        insertRequest.input("CourseID", sql.Int, Number(courseId));
        insertRequest.input("ExaminationName", sql.NVarChar, examinationName.trim());
        insertRequest.input("ExaminationDate", sql.Date, examinationDate);

        const insertResult = await insertRequest.query(`
            INSERT INTO Examinations (CourseID, ExaminationName, ExaminationDate)
            OUTPUT INSERTED.*
            VALUES (@CourseID, @ExaminationName, @ExaminationDate)
        `);

        return res.status(201).json({
            success: true,
            message: "Examination created successfully",
            data: insertResult.recordset[0]
        });
    } catch (error) {
        console.error("createExamination error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create examination"
        });
    }
};

const updateExamination = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, examinationName, examinationDate } = req.body;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Examination ID must be a positive integer"
            });
        }

        if (!courseId || !examinationName || !examinationDate) {
            return res.status(400).json({
                success: false,
                message: "courseId, examinationName, and examinationDate are required"
            });
        }

        if (!isPositiveInteger(courseId)) {
            return res.status(400).json({
                success: false,
                message: "courseId must be a positive integer"
            });
        }

        if (typeof examinationName !== "string" || examinationName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "examinationName must be a non-empty string"
            });
        }

        if (!isValidDate(examinationDate)) {
            return res.status(400).json({
                success: false,
                message: "examinationDate must be a valid date"
            });
        }

        // Check examination exists
        const existsRequest = new sql.Request();
        existsRequest.input("ExaminationID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT ExaminationID FROM Examinations WHERE ExaminationID = @ExaminationID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Examination not found"
            });
        }

        // Confirm course exists
        const courseRequest = new sql.Request();
        courseRequest.input("CourseID", sql.Int, Number(courseId));
        const courseResult = await courseRequest.query(
            "SELECT CourseID FROM Courses WHERE CourseID = @CourseID"
        );

        if (courseResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Prevent duplicate examination (exclude current record)
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("CourseID", sql.Int, Number(courseId));
        duplicateRequest.input("ExaminationName", sql.NVarChar, examinationName.trim());
        duplicateRequest.input("ExaminationDate", sql.Date, examinationDate);
        duplicateRequest.input("ExaminationID", sql.Int, Number(id));
        const duplicateResult = await duplicateRequest.query(
            "SELECT ExaminationID FROM Examinations WHERE CourseID = @CourseID AND ExaminationName = @ExaminationName AND ExaminationDate = @ExaminationDate AND ExaminationID != @ExaminationID"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An examination with the same course, name, and date already exists"
            });
        }

        // Update examination
        const updateRequest = new sql.Request();
        updateRequest.input("ExaminationID", sql.Int, Number(id));
        updateRequest.input("CourseID", sql.Int, Number(courseId));
        updateRequest.input("ExaminationName", sql.NVarChar, examinationName.trim());
        updateRequest.input("ExaminationDate", sql.Date, examinationDate);

        const updateResult = await updateRequest.query(`
            UPDATE Examinations
            SET CourseID = @CourseID,
                ExaminationName = @ExaminationName,
                ExaminationDate = @ExaminationDate
            OUTPUT INSERTED.*
            WHERE ExaminationID = @ExaminationID
        `);

        return res.status(200).json({
            success: true,
            message: "Examination updated successfully",
            data: updateResult.recordset[0]
        });
    } catch (error) {
        console.error("updateExamination error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update examination"
        });
    }
};

const deleteExamination = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Examination ID must be a positive integer"
            });
        }

        const existsRequest = new sql.Request();
        existsRequest.input("ExaminationID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT ExaminationID FROM Examinations WHERE ExaminationID = @ExaminationID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Examination not found"
            });
        }

        const deleteRequest = new sql.Request();
        deleteRequest.input("ExaminationID", sql.Int, Number(id));

        await deleteRequest.query(
            "DELETE FROM Examinations WHERE ExaminationID = @ExaminationID"
        );

        return res.status(200).json({
            success: true,
            message: "Examination deleted successfully"
        });
    } catch (error) {
        console.error("deleteExamination error:", error);

        if (error.number === 547) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete examination because it has associated results"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete examination"
        });
    }
};

module.exports = {
    getAllExaminations,
    getExaminationById,
    createExamination,
    updateExamination,
    deleteExamination
};
