const getEnrollments = async (req, res) => {
    res.json({
        message: "Get all enrollments"
    });
};

module.exports = {
    getEnrollments
};