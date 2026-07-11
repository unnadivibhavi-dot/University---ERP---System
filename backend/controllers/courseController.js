const getCourses = async (req, res) => {
    res.json({
        message: "Get all courses"
    });
};

module.exports = {
    getCourses
};