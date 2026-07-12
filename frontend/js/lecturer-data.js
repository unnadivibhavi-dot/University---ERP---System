"use strict";

/*
 * University ERP - Lecturer Mock Data
 *
 * This file stores temporary data for the Lecturer module.
 * It will be used only while LECTURER_CONFIG.USE_MOCK_DATA is true.
 */

const LECTURER_MOCK_DATA = Object.freeze({
    lecturer: {
        lecturerId: 1,
        userId: 2,
        employeeNumber: "LEC001",
        fullName: "Dr. Nadeesha Perera",
        email: "nadeesha.perera@university.edu",
        department: "Computing"
    },

    courses: [
        {
            courseId: 1,
            courseCode: "CS201",
            courseName: "Database Management Systems",
            credits: 3,
            studentCount: 4
        },
        {
            courseId: 2,
            courseCode: "CS202",
            courseName: "Software Engineering",
            credits: 3,
            studentCount: 3
        },
        {
            courseId: 3,
            courseCode: "CS203",
            courseName: "Web Application Development",
            credits: 4,
            studentCount: 3
        }
    ],

    students: [
        {
            studentId: 1,
            userId: 10,
            studentNumber: "STU001",
            fullName: "Nimal Perera",
            email: "nimal.perera@university.edu",
            courseIds: [1, 2]
        },
        {
            studentId: 2,
            userId: 11,
            studentNumber: "STU002",
            fullName: "Kamal Silva",
            email: "kamal.silva@university.edu",
            courseIds: [1, 3]
        },
        {
            studentId: 3,
            userId: 12,
            studentNumber: "STU003",
            fullName: "Saman Fernando",
            email: "saman.fernando@university.edu",
            courseIds: [1, 2, 3]
        },
        {
            studentId: 4,
            userId: 13,
            studentNumber: "STU004",
            fullName: "Tharushi Jayasinghe",
            email: "tharushi.jayasinghe@university.edu",
            courseIds: [1]
        },
        {
            studentId: 5,
            userId: 14,
            studentNumber: "STU005",
            fullName: "Dinithi Perera",
            email: "dinithi.perera@university.edu",
            courseIds: [2]
        },
        {
            studentId: 6,
            userId: 15,
            studentNumber: "STU006",
            fullName: "Kasun Bandara",
            email: "kasun.bandara@university.edu",
            courseIds: [3]
        }
    ],

    attendance: [
        {
            attendanceId: 1,
            studentId: 1,
            courseId: 1,
            attendanceDate: "2026-07-10",
            status: "Present"
        },
        {
            attendanceId: 2,
            studentId: 2,
            courseId: 1,
            attendanceDate: "2026-07-10",
            status: "Absent"
        },
        {
            attendanceId: 3,
            studentId: 3,
            courseId: 1,
            attendanceDate: "2026-07-10",
            status: "Late"
        },
        {
            attendanceId: 4,
            studentId: 4,
            courseId: 1,
            attendanceDate: "2026-07-10",
            status: "Present"
        }
    ],

    examinations: [
        {
            examinationId: 1,
            courseId: 1,
            examName: "Database Mid-Semester Examination",
            examDate: "2026-07-18",
            totalMarks: 100
        },
        {
            examinationId: 2,
            courseId: 2,
            examName: "Software Engineering Final Examination",
            examDate: "2026-07-25",
            totalMarks: 100
        },
        {
            examinationId: 3,
            courseId: 3,
            examName: "Web Development Practical Examination",
            examDate: "2026-07-28",
            totalMarks: 80
        }
    ],

    results: [
        {
            resultId: 1,
            examinationId: 1,
            studentId: 1,
            marks: 78,
            grade: "A"
        },
        {
            resultId: 2,
            examinationId: 1,
            studentId: 2,
            marks: 66,
            grade: "B"
        },
        {
            resultId: 3,
            examinationId: 1,
            studentId: 3,
            marks: 88,
            grade: "A+"
        }
    ]
});