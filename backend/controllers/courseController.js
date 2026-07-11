const getCourses = async (req, res) => {
    res.status(200).json({
        message: "Get all courses"
    });
};

const getCourseById = async (req, res) => {
    res.status(200).json({
        message: `Get course with ID ${req.params.id}`
    });
};

const createCourse = async (req, res) => {
    res.status(201).json({
        message: "Create course",
        data: req.body
    });
};

const updateCourse = async (req, res) => {
    res.status(200).json({
        message: `Update course with ID ${req.params.id}`,
        data: req.body
    });
};

const deleteCourse = async (req, res) => {
    res.status(200).json({
        message: `Delete course with ID ${req.params.id}`
    });
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};