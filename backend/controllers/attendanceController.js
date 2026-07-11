const { sql } = require("../config/db");

const isPositiveInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
};

const normalizeStatus = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().toLowerCase();
    const statusMap = { "present": "Present", "absent": "Absent", "late": "Late" };
    return statusMap[trimmed] || null;
};

const isValidDate = (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
};

const getAllAttendance = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT
                a.AttendanceID,
                a.StudentID,
                s.RegistrationNumber,
                s.FullName,
                a.CourseID,
                c.CourseCode,
                c.CourseName,
                a.AttendanceDate,
                a.Status
            FROM Attendance a
            INNER JOIN Students s ON a.StudentID = s.StudentID
            INNER JOIN Courses c ON a.CourseID = c.CourseID
            ORDER BY a.AttendanceDate DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("getAllAttendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve attendance records"
        });
    }
};

const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID must be a positive integer"
            });
        }

        const request = new sql.Request();
        request.input("AttendanceID", sql.Int, Number(id));

        const result = await request.query(`
            SELECT
                a.AttendanceID,
                a.StudentID,
                s.RegistrationNumber,
                s.FullName,
                a.CourseID,
                c.CourseCode,
                c.CourseName,
                a.AttendanceDate,
                a.Status
            FROM Attendance a
            INNER JOIN Students s ON a.StudentID = s.StudentID
            INNER JOIN Courses c ON a.CourseID = c.CourseID
            WHERE a.AttendanceID = @AttendanceID
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("getAttendanceById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve attendance record"
        });
    }
};

const getAttendanceByStudent = async (req, res) => {
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
                a.AttendanceID,
                a.StudentID,
                s.RegistrationNumber,
                s.FullName,
                a.CourseID,
                c.CourseCode,
                c.CourseName,
                a.AttendanceDate,
                a.Status
            FROM Attendance a
            INNER JOIN Students s ON a.StudentID = s.StudentID
            INNER JOIN Courses c ON a.CourseID = c.CourseID
            WHERE a.StudentID = @StudentID
            ORDER BY a.AttendanceDate DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("getAttendanceByStudent error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve attendance records for student"
        });
    }
};

const createAttendance = async (req, res) => {
    try {
        const { studentId, courseId, attendanceDate, status } = req.body;

        if (!studentId || !courseId || !attendanceDate || !status) {
            return res.status(400).json({
                success: false,
                message: "studentId, courseId, attendanceDate, and status are required"
            });
        }

        if (!isPositiveInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "studentId must be a positive integer"
            });
        }

        if (!isPositiveInteger(courseId)) {
            return res.status(400).json({
                success: false,
                message: "courseId must be a positive integer"
            });
        }

        if (!isValidDate(attendanceDate)) {
            return res.status(400).json({
                success: false,
                message: "attendanceDate must be a valid date"
            });
        }

        const normalizedStatus = normalizeStatus(status);

        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message: "status must be Present, Absent, or Late"
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

        // Confirm student is enrolled in the course
        const enrollmentRequest = new sql.Request();
        enrollmentRequest.input("StudentID", sql.Int, Number(studentId));
        enrollmentRequest.input("CourseID", sql.Int, Number(courseId));
        const enrollmentResult = await enrollmentRequest.query(
            "SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CourseID = @CourseID"
        );

        if (enrollmentResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student is not enrolled in this course"
            });
        }

        // Prevent duplicate attendance for same student, course, and date
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("StudentID", sql.Int, Number(studentId));
        duplicateRequest.input("CourseID", sql.Int, Number(courseId));
        duplicateRequest.input("AttendanceDate", sql.Date, attendanceDate);
        const duplicateResult = await duplicateRequest.query(
            "SELECT AttendanceID FROM Attendance WHERE StudentID = @StudentID AND CourseID = @CourseID AND AttendanceDate = @AttendanceDate"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Attendance already recorded for this student, course, and date"
            });
        }

        // Insert attendance record
        const insertRequest = new sql.Request();
        insertRequest.input("StudentID", sql.Int, Number(studentId));
        insertRequest.input("CourseID", sql.Int, Number(courseId));
        insertRequest.input("AttendanceDate", sql.Date, attendanceDate);
        insertRequest.input("Status", sql.NVarChar, normalizedStatus);

        const insertResult = await insertRequest.query(`
            INSERT INTO Attendance (StudentID, CourseID, AttendanceDate, Status)
            OUTPUT INSERTED.*
            VALUES (@StudentID, @CourseID, @AttendanceDate, @Status)
        `);

        return res.status(201).json({
            success: true,
            message: "Attendance recorded successfully",
            data: insertResult.recordset[0]
        });
    } catch (error) {
        console.error("createAttendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create attendance record"
        });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId, courseId, attendanceDate, status } = req.body;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID must be a positive integer"
            });
        }

        if (!studentId || !courseId || !attendanceDate || !status) {
            return res.status(400).json({
                success: false,
                message: "studentId, courseId, attendanceDate, and status are required"
            });
        }

        if (!isPositiveInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "studentId must be a positive integer"
            });
        }

        if (!isPositiveInteger(courseId)) {
            return res.status(400).json({
                success: false,
                message: "courseId must be a positive integer"
            });
        }

        if (!isValidDate(attendanceDate)) {
            return res.status(400).json({
                success: false,
                message: "attendanceDate must be a valid date"
            });
        }

        const normalizedStatus = normalizeStatus(status);

        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message: "status must be Present, Absent, or Late"
            });
        }

        // Check attendance record exists
        const existsRequest = new sql.Request();
        existsRequest.input("AttendanceID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT AttendanceID FROM Attendance WHERE AttendanceID = @AttendanceID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
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

        // Confirm student is enrolled in the course
        const enrollmentRequest = new sql.Request();
        enrollmentRequest.input("StudentID", sql.Int, Number(studentId));
        enrollmentRequest.input("CourseID", sql.Int, Number(courseId));
        const enrollmentResult = await enrollmentRequest.query(
            "SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CourseID = @CourseID"
        );

        if (enrollmentResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student is not enrolled in this course"
            });
        }

        // Prevent duplicate attendance (exclude current record)
        const duplicateRequest = new sql.Request();
        duplicateRequest.input("StudentID", sql.Int, Number(studentId));
        duplicateRequest.input("CourseID", sql.Int, Number(courseId));
        duplicateRequest.input("AttendanceDate", sql.Date, attendanceDate);
        duplicateRequest.input("AttendanceID", sql.Int, Number(id));
        const duplicateResult = await duplicateRequest.query(
            "SELECT AttendanceID FROM Attendance WHERE StudentID = @StudentID AND CourseID = @CourseID AND AttendanceDate = @AttendanceDate AND AttendanceID != @AttendanceID"
        );

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Attendance already recorded for this student, course, and date"
            });
        }

        // Update attendance record
        const updateRequest = new sql.Request();
        updateRequest.input("AttendanceID", sql.Int, Number(id));
        updateRequest.input("StudentID", sql.Int, Number(studentId));
        updateRequest.input("CourseID", sql.Int, Number(courseId));
        updateRequest.input("AttendanceDate", sql.Date, attendanceDate);
        updateRequest.input("Status", sql.NVarChar, normalizedStatus);

        const updateResult = await updateRequest.query(`
            UPDATE Attendance
            SET StudentID = @StudentID,
                CourseID = @CourseID,
                AttendanceDate = @AttendanceDate,
                Status = @Status
            OUTPUT INSERTED.*
            WHERE AttendanceID = @AttendanceID
        `);

        return res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            data: updateResult.recordset[0]
        });
    } catch (error) {
        console.error("updateAttendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update attendance record"
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID must be a positive integer"
            });
        }

        const existsRequest = new sql.Request();
        existsRequest.input("AttendanceID", sql.Int, Number(id));
        const existsResult = await existsRequest.query(
            "SELECT AttendanceID FROM Attendance WHERE AttendanceID = @AttendanceID"
        );

        if (existsResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        const deleteRequest = new sql.Request();
        deleteRequest.input("AttendanceID", sql.Int, Number(id));
        await deleteRequest.query(
            "DELETE FROM Attendance WHERE AttendanceID = @AttendanceID"
        );

        return res.status(200).json({
            success: true,
            message: "Attendance deleted successfully"
        });
    } catch (error) {
        console.error("deleteAttendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete attendance record"
        });
    }
};

module.exports = {
    getAllAttendance,
    getAttendanceById,
    getAttendanceByStudent,
    createAttendance,
    updateAttendance,
    deleteAttendance
};
