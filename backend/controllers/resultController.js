const { sql } = require("../config/db");
const { calculateGrade } = require("../utils/gradeCalculator");

const isPositiveInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
};

const isValidMarks = (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
};

const getAllResults = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT
                r.ResultID,
                r.ExaminationID,
                e.ExaminationName,
                e.ExaminationDate,
                r.StudentID,
                s.RegistrationNumber,
                s.FullName,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                r.Marks,
                r.Grade
            FROM Results r
            INNER JOIN Examinations e ON r.ExaminationID = e.ExaminationID
            INNER JOIN Students s ON r.StudentID = s.StudentID
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            ORDER BY e.ExaminationDate DESC, s.FullName ASC
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("getAllResults error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve results"
        });
    }
};

const getResultById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Result ID must be a positive integer"
            });
        }

        const request = new sql.Request();
        request.input("ResultID", sql.Int, Number(id));

        const result = await request.query(`
            SELECT
                r.ResultID,
                r.ExaminationID,
                e.ExaminationName,
                e.ExaminationDate,
                r.StudentID,
                s.RegistrationNumber,
                s.FullName,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                r.Marks,
                r.Grade
            FROM Results r
            INNER JOIN Examinations e ON r.ExaminationID = e.ExaminationID
            INNER JOIN Students s ON r.StudentID = s.StudentID
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            WHERE r.ResultID = @ResultID
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Result not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("getResultById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve result"
        });
    }
};

const getResultsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!isPositiveInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Student ID must be a positive integer"
            });
        }

        const studentRequest = new sql.Request();
        studentRequest.input("StudentID", sql.Int, Number(studentId));
        const studentResult = await studentRequest.query(
            "SELECT StudentID FROM Students WHERE StudentID = @StudentID"
        );

        if (studentResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const request = new sql.Request();
        request.input("StudentID", sql.Int, Number(studentId));

        const result = await request.query(`
            SELECT
                r.ResultID,
                r.ExaminationID,
                e.ExaminationName,
                e.ExaminationDate,
                r.StudentID,
                s.RegistrationNumber,
                s.FullName,
                e.CourseID,
                c.CourseCode,
                c.CourseName,
                r.Marks,
                r.Grade
            FROM Results r
            INNER JOIN Examinations e ON r.ExaminationID = e.ExaminationID
            INNER JOIN Students s ON r.StudentID = s.StudentID
            INNER JOIN Courses c ON e.CourseID = c.CourseID
            WHERE r.StudentID = @StudentID
            ORDER BY e.ExaminationDate DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("getResultsByStudent error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve results for student"
        });
    }
};

const createResult = async (req, res) => {
    try {
        const { examinationId, studentId, marks } = req.body;

        if (!examinationId || !studentId || marks === undefined || marks === null || marks === "") {
            return res.status(400).json({
                success: false,
                message: "examinationId, studentId, and marks are required"
            });
        }

        if (!isPositiveInteger(examinationId)) {
            return res.status(400).json({
                success: false,
                message: "examinationId must be a positive integer"
            });
        }

        if (!isPositiveInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "studentId must be a positive integer"
            });
        }

        if (!isValidMarks(marks)) {
            return res.status(400).json({
                success: false,
                message: "marks must be a number between 0 and 100"
            });
        }

        // Confirm student exists
        const studentRequest = new sql.Request();
        studentRequest.input("StudentID", sql.Int, Number(studentId));
        const studentResult = await studentRequest.query(
            "SELECT StudentID FROM Students WHERE StudentID = @StudentID"
        );

        if (studentResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Confirm examination exists and retrieve CourseID
        const examRequest = new sql.Request();
        examRequest.input("ExaminationID", sql.Int, Number(examinationId));
        const examResult = await examRequest.query(
            "SELECT ExaminationID, CourseID FROM Examinations WHERE ExaminationID = @ExaminationID"
        );

        if (examResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Examination not found"
            });
        }

        const courseId = examResult.recordset[0].CourseID;

        // Confirm student is enrolled in the course
        const enrollmentRequest = new sql.Request();
        enrollmentRequest.input("StudentID", sql.Int, Number(studentId));
        enrollmentRequest.input("CourseID", sql.Int, courseId);
        const enrollmentResult = await enrollmentRequest.query(
            "SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CourseID = @CourseID"
        );

        if (enrollmentResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student is not enrolled in the course for this examination"
            });
        }

        // Prevent duplicate result for same student and examination
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("StudentID", sql.Int, Number(studentId));
        duplicateRequest.input("ExaminationID", sql.Int, Number(examinationId));
        const duplicateResult = await duplicateRequest.query(
            "SELECT ResultID FROM Results WHERE StudentID = @StudentID AND ExaminationID = @ExaminationID"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Result already exists for this student and examination"
            });
        }

        // Calculate grade
        const numericMarks = Number(marks);
        const grade = calculateGrade(numericMarks);

        // Insert result
        const insertRequest = new sql.Request();
        insertRequest.input("ExaminationID", sql.Int, Number(examinationId));
        insertRequest.input("StudentID", sql.Int, Number(studentId));
        insertRequest.input("Marks", sql.Decimal(5, 2), numericMarks);
        insertRequest.input("Grade", sql.NVarChar, grade);

        const insertResult = await insertRequest.query(`
            INSERT INTO Results (ExaminationID, StudentID, Marks, Grade)
            OUTPUT INSERTED.*
            VALUES (@ExaminationID, @StudentID, @Marks, @Grade)
        `);

        return res.status(201).json({
            success: true,
            message: "Result created successfully",
            data: insertResult.recordset[0]
        });
    } catch (error) {
        console.error("createResult error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create result"
        });
    }
};

const updateResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { examinationId, studentId, marks } = req.body;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Result ID must be a positive integer"
            });
        }

        if (!examinationId || !studentId || marks === undefined || marks === null || marks === "") {
            return res.status(400).json({
                success: false,
                message: "examinationId, studentId, and marks are required"
            });
        }

        if (!isPositiveInteger(examinationId)) {
            return res.status(400).json({
                success: false,
                message: "examinationId must be a positive integer"
            });
        }

        if (!isPositiveInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "studentId must be a positive integer"
            });
        }

        if (!isValidMarks(marks)) {
            return res.status(400).json({
                success: false,
                message: "marks must be a number between 0 and 100"
            });
        }

        // Check result exists
        const existsRequest = new sql.Request();
        existsRequest.input("ResultID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT ResultID FROM Results WHERE ResultID = @ResultID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Result not found"
            });
        }

        // Confirm student exists
        const studentRequest = new sql.Request();
        studentRequest.input("StudentID", sql.Int, Number(studentId));
        const studentResult = await studentRequest.query(
            "SELECT StudentID FROM Students WHERE StudentID = @StudentID"
        );

        if (studentResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Confirm examination exists and retrieve CourseID
        const examRequest = new sql.Request();
        examRequest.input("ExaminationID", sql.Int, Number(examinationId));
        const examResult = await examRequest.query(
            "SELECT ExaminationID, CourseID FROM Examinations WHERE ExaminationID = @ExaminationID"
        );

        if (examResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Examination not found"
            });
        }

        const courseId = examResult.recordset[0].CourseID;

        // Confirm student is enrolled in the course
        const enrollmentRequest = new sql.Request();
        enrollmentRequest.input("StudentID", sql.Int, Number(studentId));
        enrollmentRequest.input("CourseID", sql.Int, courseId);
        const enrollmentResult = await enrollmentRequest.query(
            "SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CourseID = @CourseID"
        );

        if (enrollmentResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student is not enrolled in the course for this examination"
            });
        }

        // Prevent duplicate result (exclude current record)
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("StudentID", sql.Int, Number(studentId));
        duplicateRequest.input("ExaminationID", sql.Int, Number(examinationId));
        duplicateRequest.input("ResultID", sql.Int, Number(id));
        const duplicateResult = await duplicateRequest.query(
            "SELECT ResultID FROM Results WHERE StudentID = @StudentID AND ExaminationID = @ExaminationID AND ResultID != @ResultID"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Result already exists for this student and examination"
            });
        }

        // Recalculate grade
        const numericMarks = Number(marks);
        const grade = calculateGrade(numericMarks);

        // Update result
        const updateRequest = new sql.Request();
        updateRequest.input("ResultID", sql.Int, Number(id));
        updateRequest.input("ExaminationID", sql.Int, Number(examinationId));
        updateRequest.input("StudentID", sql.Int, Number(studentId));
        updateRequest.input("Marks", sql.Decimal(5, 2), numericMarks);
        updateRequest.input("Grade", sql.NVarChar, grade);

        const updateResult = await updateRequest.query(`
            UPDATE Results
            SET ExaminationID = @ExaminationID,
                StudentID = @StudentID,
                Marks = @Marks,
                Grade = @Grade
            OUTPUT INSERTED.*
            WHERE ResultID = @ResultID
        `);

        return res.status(200).json({
            success: true,
            message: "Result updated successfully",
            data: updateResult.recordset[0]
        });
    } catch (error) {
        console.error("updateResult error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update result"
        });
    }
};

const deleteResult = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Result ID must be a positive integer"
            });
        }

        const existsRequest = new sql.Request();
        existsRequest.input("ResultID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT ResultID FROM Results WHERE ResultID = @ResultID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Result not found"
            });
        }

        const deleteRequest = new sql.Request();
        deleteRequest.input("ResultID", sql.Int, Number(id));
        await deleteRequest.query(
            "DELETE FROM Results WHERE ResultID = @ResultID"
        );

        return res.status(200).json({
            success: true,
            message: "Result deleted successfully"
        });
    } catch (error) {
        console.error("deleteResult error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete result"
        });
    }
};

module.exports = {
    getAllResults,
    getResultById,
    getResultsByStudent,
    createResult,
    updateResult,
    deleteResult
};
