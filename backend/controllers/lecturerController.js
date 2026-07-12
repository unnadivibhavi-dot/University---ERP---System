const { sql, getPool } = require("../config/db");
const { calculateGrade } = require("../utils/gradeCalculator");

/*
  Finds the lecturer record connected to the logged-in user.
  req.user.userId must come from the verified JWT token.
*/
async function findLecturerByUserId(userId) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input("UserID", sql.Int, userId)
        .query(`
      SELECT
        LecturerID,
        UserID,
        EmployeeNumber,
        FullName,
        Email,
        Department
      FROM Lecturers
      WHERE UserID = @UserID
    `);

    return result.recordset[0];
}

/*
  Checks whether the lecturer is assigned to a selected course.
*/
async function lecturerOwnsCourse(lecturerId, courseId) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input("LecturerID", sql.Int, lecturerId)
        .input("CourseID", sql.Int, courseId)
        .query(`
      SELECT LecturerCourseID
      FROM LecturerCourses
      WHERE LecturerID = @LecturerID
        AND CourseID = @CourseID
    `);

    return result.recordset.length > 0;
}

/*
  GET /api/lecturer/profile
*/
async function getLecturerProfile(req, res) {
    try {
        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        return res.status(200).json({
            message: "Lecturer profile retrieved successfully",
            data: lecturer
        });
    } catch (error) {
        console.error("Get lecturer profile error:", error);

        return res.status(500).json({
            message: "Unable to retrieve lecturer profile",
            data: null
        });
    }
}

/*
  GET /api/lecturer/dashboard-summary
*/
async function getDashboardSummary(req, res) {
    try {
        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("LecturerID", sql.Int, lecturer.LecturerID)
            .query(`
        SELECT
          (
            SELECT COUNT(*)
            FROM LecturerCourses
            WHERE LecturerID = @LecturerID
          ) AS AssignedCourses,

          (
            SELECT COUNT(DISTINCT E.StudentID)
            FROM LecturerCourses LC
            INNER JOIN Enrollments E
              ON E.CourseID = LC.CourseID
            WHERE LC.LecturerID = @LecturerID
          ) AS TotalStudents,

          (
            SELECT COUNT(*)
            FROM LecturerCourses LC
            INNER JOIN Examinations EX
              ON EX.CourseID = LC.CourseID
            WHERE LC.LecturerID = @LecturerID
              AND EX.ExaminationDate >= CAST(GETDATE() AS DATE)
          ) AS UpcomingExaminations,

          (
            SELECT COUNT(*)
            FROM LecturerCourses LC
            INNER JOIN Attendance A
              ON A.CourseID = LC.CourseID
            WHERE LC.LecturerID = @LecturerID
              AND A.AttendanceDate = CAST(GETDATE() AS DATE)
          ) AS AttendanceRecordsToday
      `);

        return res.status(200).json({
            message: "Dashboard summary retrieved successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Dashboard summary error:", error);

        return res.status(500).json({
            message: "Unable to retrieve dashboard summary",
            data: null
        });
    }
}

/*
  GET /api/lecturer/courses
*/
async function getLecturerCourses(req, res) {
    try {
        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: []
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("LecturerID", sql.Int, lecturer.LecturerID)
            .query(`
        SELECT
          C.CourseID,
          C.CourseCode,
          C.CourseName,
          C.Credits,
          C.Department
        FROM LecturerCourses LC
        INNER JOIN Courses C
          ON C.CourseID = LC.CourseID
        WHERE LC.LecturerID = @LecturerID
        ORDER BY C.CourseCode
      `);

        return res.status(200).json({
            message: "Assigned courses retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get lecturer courses error:", error);

        return res.status(500).json({
            message: "Unable to retrieve assigned courses",
            data: []
        });
    }
}

/*
  GET /api/lecturer/courses/:courseId/students
*/
async function getCourseStudents(req, res) {
    try {
        const courseId = Number(req.params.courseId);

        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({
                message: "Invalid course ID",
                data: []
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: []
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            courseId
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You are not assigned to this course",
                data: []
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("CourseID", sql.Int, courseId)
            .query(`
        SELECT
          S.StudentID,
          S.RegistrationNumber,
          S.FullName,
          S.Email,
          S.Department,
          S.AcademicYear,
          E.EnrollmentDate
        FROM Enrollments E
        INNER JOIN Students S
          ON S.StudentID = E.StudentID
        WHERE E.CourseID = @CourseID
        ORDER BY S.RegistrationNumber
      `);

        return res.status(200).json({
            message: "Enrolled students retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get course students error:", error);

        return res.status(500).json({
            message: "Unable to retrieve enrolled students",
            data: []
        });
    }
}

/*
  GET /api/lecturer/attendance/:courseId
*/
async function getAttendance(req, res) {
    try {
        const courseId = Number(req.params.courseId);
        const attendanceDate = req.query.date;

        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({
                message: "Invalid course ID",
                data: []
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: []
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            courseId
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You are not assigned to this course",
                data: []
            });
        }

        const pool = await getPool();
        const request = pool
            .request()
            .input("CourseID", sql.Int, courseId);

        let query = `
      SELECT
        A.AttendanceID,
        A.StudentID,
        S.RegistrationNumber,
        S.FullName,
        A.CourseID,
        A.AttendanceDate,
        A.Status
      FROM Attendance A
      INNER JOIN Students S
        ON S.StudentID = A.StudentID
      WHERE A.CourseID = @CourseID
    `;

        if (attendanceDate) {
            request.input("AttendanceDate", sql.Date, attendanceDate);

            query += `
        AND A.AttendanceDate = @AttendanceDate
      `;
        }

        query += `
      ORDER BY A.AttendanceDate DESC, S.RegistrationNumber
    `;

        const result = await request.query(query);

        return res.status(200).json({
            message: "Attendance retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get attendance error:", error);

        return res.status(500).json({
            message: "Unable to retrieve attendance",
            data: []
        });
    }
}

/*
  POST /api/lecturer/attendance
*/
async function markAttendance(req, res) {
    try {
        const {
            studentId,
            courseId,
            attendanceDate,
            status
        } = req.body;

        const validStatuses = ["Present", "Absent", "Late"];

        if (!studentId || !courseId || !attendanceDate || !status) {
            return res.status(400).json({
                message:
                    "Student, course, attendance date and status are required",
                data: null
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status must be Present, Absent or Late",
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            Number(courseId)
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You are not assigned to this course",
                data: null
            });
        }

        const pool = await getPool();

        const enrollmentCheck = await pool
            .request()
            .input("StudentID", sql.Int, Number(studentId))
            .input("CourseID", sql.Int, Number(courseId))
            .query(`
        SELECT EnrollmentID
        FROM Enrollments
        WHERE StudentID = @StudentID
          AND CourseID = @CourseID
      `);

        if (enrollmentCheck.recordset.length === 0) {
            return res.status(400).json({
                message: "Student is not enrolled in this course",
                data: null
            });
        }

        const result = await pool
            .request()
            .input("StudentID", sql.Int, Number(studentId))
            .input("CourseID", sql.Int, Number(courseId))
            .input("AttendanceDate", sql.Date, attendanceDate)
            .input("Status", sql.NVarChar(20), status)
            .query(`
        INSERT INTO Attendance
        (
          StudentID,
          CourseID,
          AttendanceDate,
          Status
        )
        OUTPUT INSERTED.*
        VALUES
        (
          @StudentID,
          @CourseID,
          @AttendanceDate,
          @Status
        )
      `);

        return res.status(201).json({
            message: "Attendance recorded successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Mark attendance error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                message:
                    "Attendance already exists for this student, course and date",
                data: null
            });
        }

        return res.status(500).json({
            message: "Unable to record attendance",
            data: null
        });
    }
}

/*
  PUT /api/lecturer/attendance/:attendanceId
*/
async function updateAttendance(req, res) {
    try {
        const attendanceId = Number(req.params.attendanceId);
        const { status } = req.body;

        const validStatuses = ["Present", "Absent", "Late"];

        if (!Number.isInteger(attendanceId) || attendanceId <= 0) {
            return res.status(400).json({
                message: "Invalid attendance ID",
                data: null
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status must be Present, Absent or Late",
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        const pool = await getPool();

        const attendanceCheck = await pool
            .request()
            .input("AttendanceID", sql.Int, attendanceId)
            .query(`
        SELECT CourseID
        FROM Attendance
        WHERE AttendanceID = @AttendanceID
      `);

        if (attendanceCheck.recordset.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            attendanceCheck.recordset[0].CourseID
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot update this attendance record",
                data: null
            });
        }

        const result = await pool
            .request()
            .input("AttendanceID", sql.Int, attendanceId)
            .input("Status", sql.NVarChar(20), status)
            .query(`
        UPDATE Attendance
        SET Status = @Status
        OUTPUT INSERTED.*
        WHERE AttendanceID = @AttendanceID
      `);

        return res.status(200).json({
            message: "Attendance updated successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Update attendance error:", error);

        return res.status(500).json({
            message: "Unable to update attendance",
            data: null
        });
    }
}

/*
  DELETE /api/lecturer/attendance/:attendanceId
*/
async function deleteAttendance(req, res) {
    try {
        const attendanceId = Number(req.params.attendanceId);

        if (!Number.isInteger(attendanceId) || attendanceId <= 0) {
            return res.status(400).json({
                message: "Invalid attendance ID",
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        const pool = await getPool();

        const record = await pool
            .request()
            .input("AttendanceID", sql.Int, attendanceId)
            .query(`
        SELECT CourseID
        FROM Attendance
        WHERE AttendanceID = @AttendanceID
      `);

        if (record.recordset.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            record.recordset[0].CourseID
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot delete this attendance record",
                data: null
            });
        }

        await pool
            .request()
            .input("AttendanceID", sql.Int, attendanceId)
            .query(`
        DELETE FROM Attendance
        WHERE AttendanceID = @AttendanceID
      `);

        return res.status(200).json({
            message: "Attendance deleted successfully",
            data: null
        });
    } catch (error) {
        console.error("Delete attendance error:", error);

        return res.status(500).json({
            message: "Unable to delete attendance",
            data: null
        });
    }
}

/*
  GET /api/lecturer/examinations
*/
async function getExaminations(req, res) {
    try {
        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: []
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("LecturerID", sql.Int, lecturer.LecturerID)
            .query(`
        SELECT
          EX.ExaminationID,
          EX.CourseID,
          C.CourseCode,
          C.CourseName,
          EX.ExaminationName,
          EX.ExaminationDate
        FROM LecturerCourses LC
        INNER JOIN Courses C
          ON C.CourseID = LC.CourseID
        INNER JOIN Examinations EX
          ON EX.CourseID = C.CourseID
        WHERE LC.LecturerID = @LecturerID
        ORDER BY EX.ExaminationDate DESC
      `);

        return res.status(200).json({
            message: "Examinations retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get examinations error:", error);

        return res.status(500).json({
            message: "Unable to retrieve examinations",
            data: []
        });
    }
}

/*
  POST /api/lecturer/examinations
*/
async function createExamination(req, res) {
    try {
        const {
            courseId,
            examinationName,
            examinationDate
        } = req.body;

        if (!courseId || !examinationName || !examinationDate) {
            return res.status(400).json({
                message:
                    "Course, examination name and examination date are required",
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            Number(courseId)
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You are not assigned to this course",
                data: null
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("CourseID", sql.Int, Number(courseId))
            .input(
                "ExaminationName",
                sql.NVarChar(100),
                examinationName.trim()
            )
            .input("ExaminationDate", sql.Date, examinationDate)
            .query(`
        INSERT INTO Examinations
        (
          CourseID,
          ExaminationName,
          ExaminationDate
        )
        OUTPUT INSERTED.*
        VALUES
        (
          @CourseID,
          @ExaminationName,
          @ExaminationDate
        )
      `);

        return res.status(201).json({
            message: "Examination created successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Create examination error:", error);

        return res.status(500).json({
            message: "Unable to create examination",
            data: null
        });
    }
}

/*
  PUT /api/lecturer/examinations/:examinationId
*/
async function updateExamination(req, res) {
    try {
        const examinationId = Number(req.params.examinationId);
        const {
            examinationName,
            examinationDate
        } = req.body;

        if (!Number.isInteger(examinationId) || examinationId <= 0) {
            return res.status(400).json({
                message: "Invalid examination ID",
                data: null
            });
        }

        if (!examinationName || !examinationDate) {
            return res.status(400).json({
                message:
                    "Examination name and examination date are required",
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);
        const pool = await getPool();

        const examCheck = await pool
            .request()
            .input("ExaminationID", sql.Int, examinationId)
            .query(`
        SELECT CourseID
        FROM Examinations
        WHERE ExaminationID = @ExaminationID
      `);

        if (examCheck.recordset.length === 0) {
            return res.status(404).json({
                message: "Examination not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            examCheck.recordset[0].CourseID
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot update this examination",
                data: null
            });
        }

        const result = await pool
            .request()
            .input("ExaminationID", sql.Int, examinationId)
            .input(
                "ExaminationName",
                sql.NVarChar(100),
                examinationName.trim()
            )
            .input("ExaminationDate", sql.Date, examinationDate)
            .query(`
        UPDATE Examinations
        SET
          ExaminationName = @ExaminationName,
          ExaminationDate = @ExaminationDate
        OUTPUT INSERTED.*
        WHERE ExaminationID = @ExaminationID
      `);

        return res.status(200).json({
            message: "Examination updated successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Update examination error:", error);

        return res.status(500).json({
            message: "Unable to update examination",
            data: null
        });
    }
}

/*
  GET /api/lecturer/results/:examinationId
*/
async function getResults(req, res) {
    try {
        const examinationId = Number(req.params.examinationId);

        if (!Number.isInteger(examinationId) || examinationId <= 0) {
            return res.status(400).json({
                message: "Invalid examination ID",
                data: []
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);
        const pool = await getPool();

        const examCheck = await pool
            .request()
            .input("ExaminationID", sql.Int, examinationId)
            .query(`
        SELECT CourseID
        FROM Examinations
        WHERE ExaminationID = @ExaminationID
      `);

        if (examCheck.recordset.length === 0) {
            return res.status(404).json({
                message: "Examination not found",
                data: []
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            examCheck.recordset[0].CourseID
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot view results for this examination",
                data: []
            });
        }

        const result = await pool
            .request()
            .input("ExaminationID", sql.Int, examinationId)
            .query(`
        SELECT
          R.ResultID,
          R.ExaminationID,
          R.StudentID,
          S.RegistrationNumber,
          S.FullName,
          R.Marks,
          R.Grade
        FROM Results R
        INNER JOIN Students S
          ON S.StudentID = R.StudentID
        WHERE R.ExaminationID = @ExaminationID
        ORDER BY S.RegistrationNumber
      `);

        return res.status(200).json({
            message: "Results retrieved successfully",
            data: result.recordset
        });
    } catch (error) {
        console.error("Get results error:", error);

        return res.status(500).json({
            message: "Unable to retrieve results",
            data: []
        });
    }
}

/*
  POST /api/lecturer/results
*/
async function addResult(req, res) {
    try {
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
                message: "Examination, student and marks are required",
                data: null
            });
        }

        let grade;

        try {
            grade = calculateGrade(marks);
        } catch (validationError) {
            return res.status(400).json({
                message: validationError.message,
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);
        const pool = await getPool();

        const examCheck = await pool
            .request()
            .input("ExaminationID", sql.Int, Number(examinationId))
            .query(`
        SELECT CourseID
        FROM Examinations
        WHERE ExaminationID = @ExaminationID
      `);

        if (examCheck.recordset.length === 0) {
            return res.status(404).json({
                message: "Examination not found",
                data: null
            });
        }

        const courseId = examCheck.recordset[0].CourseID;

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            courseId
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot add results for this examination",
                data: null
            });
        }

        const enrollmentCheck = await pool
            .request()
            .input("StudentID", sql.Int, Number(studentId))
            .input("CourseID", sql.Int, courseId)
            .query(`
        SELECT EnrollmentID
        FROM Enrollments
        WHERE StudentID = @StudentID
          AND CourseID = @CourseID
      `);

        if (enrollmentCheck.recordset.length === 0) {
            return res.status(400).json({
                message:
                    "Student is not enrolled in the examination course",
                data: null
            });
        }

        const result = await pool
            .request()
            .input("ExaminationID", sql.Int, Number(examinationId))
            .input("StudentID", sql.Int, Number(studentId))
            .input("Marks", sql.Decimal(5, 2), Number(marks))
            .input("Grade", sql.NVarChar(5), grade)
            .query(`
        INSERT INTO Results
        (
          ExaminationID,
          StudentID,
          Marks,
          Grade
        )
        OUTPUT INSERTED.*
        VALUES
        (
          @ExaminationID,
          @StudentID,
          @Marks,
          @Grade
        )
      `);

        return res.status(201).json({
            message: "Result added successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Add result error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                message:
                    "A result already exists for this student and examination",
                data: null
            });
        }

        return res.status(500).json({
            message: "Unable to add result",
            data: null
        });
    }
}

/*
  PUT /api/lecturer/results/:resultId
*/
async function updateResult(req, res) {
    try {
        const resultId = Number(req.params.resultId);
        const { marks } = req.body;

        if (!Number.isInteger(resultId) || resultId <= 0) {
            return res.status(400).json({
                message: "Invalid result ID",
                data: null
            });
        }

        let grade;

        try {
            grade = calculateGrade(marks);
        } catch (validationError) {
            return res.status(400).json({
                message: validationError.message,
                data: null
            });
        }

        const lecturer = await findLecturerByUserId(req.user.userId);
        const pool = await getPool();

        const resultCheck = await pool
            .request()
            .input("ResultID", sql.Int, resultId)
            .query(`
        SELECT EX.CourseID
        FROM Results R
        INNER JOIN Examinations EX
          ON EX.ExaminationID = R.ExaminationID
        WHERE R.ResultID = @ResultID
      `);

        if (resultCheck.recordset.length === 0) {
            return res.status(404).json({
                message: "Result not found",
                data: null
            });
        }

        const ownsCourse = await lecturerOwnsCourse(
            lecturer.LecturerID,
            resultCheck.recordset[0].CourseID
        );

        if (!ownsCourse) {
            return res.status(403).json({
                message: "You cannot update this result",
                data: null
            });
        }

        const result = await pool
            .request()
            .input("ResultID", sql.Int, resultId)
            .input("Marks", sql.Decimal(5, 2), Number(marks))
            .input("Grade", sql.NVarChar(5), grade)
            .query(`
        UPDATE Results
        SET
          Marks = @Marks,
          Grade = @Grade
        OUTPUT INSERTED.*
        WHERE ResultID = @ResultID
      `);

        return res.status(200).json({
            message: "Result updated successfully",
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Update result error:", error);

        return res.status(500).json({
            message: "Unable to update result",
            data: null
        });
    }
}

module.exports = {
    getLecturerProfile,
    getDashboardSummary,
    getLecturerCourses,
    getCourseStudents,
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    getExaminations,
    createExamination,
    updateExamination,
    getResults,
    addResult,
    updateResult
};