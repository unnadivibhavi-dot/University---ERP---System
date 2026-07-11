const getEnrollments = async (req, res) => {
    res.status(200).json({
        message: "Get all enrollments"
    });
};

const getEnrollmentById = async (req, res) => {
    res.status(200).json({
        message: `Get enrollment with ID ${req.params.id}`
    });
};

const createEnrollment = async (req, res) => {
    res.status(201).json({
        message: "Create enrollment",
        data: req.body
    });
};

const deleteEnrollment = async (req, res) => {
    res.status(200).json({
        message: `Delete enrollment with ID ${req.params.id}`
    });
};

module.exports = {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    deleteEnrollment
};