const getStudents = async (req, res) => {
    res.status(200).json({
        message: "Get all students"
    });
};

const getStudentById = async (req, res) => {
    res.status(200).json({
        message: `Get student with ID ${req.params.id}`
    });
};

const createStudent = async (req, res) => {
    res.status(201).json({
        message: "Create student",
        data: req.body
    });
};

const updateStudent = async (req, res) => {
    res.status(200).json({
        message: `Update student with ID ${req.params.id}`,
        data: req.body
    });
};

const deleteStudent = async (req, res) => {
    res.status(200).json({
        message: `Delete student with ID ${req.params.id}`
    });
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};