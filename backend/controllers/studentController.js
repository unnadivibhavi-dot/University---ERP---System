const getStudents = async (req, res) => {
    res.json({
        message: "Get all students"
    });
};

const getStudentById = async (req, res) => {
    res.json({
        message: "Get student by ID"
    });
};

const createStudent = async (req, res) => {
    res.json({
        message: "Create student"
    });
};

const updateStudent = async (req, res) => {
    res.json({
        message: "Update student"
    });
};

const deleteStudent = async (req, res) => {
    res.json({
        message: "Delete student"
    });
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};