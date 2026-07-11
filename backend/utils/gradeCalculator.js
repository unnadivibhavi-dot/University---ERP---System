const calculateGrade = (marks) => {
    if (marks === null || marks === undefined || marks === "") {
        throw new Error("Marks value is required");
    }

    const numericMarks = Number(marks);

    if (isNaN(numericMarks)) {
        throw new Error("Marks must be a valid number");
    }

    if (numericMarks < 0) {
        throw new Error("Marks cannot be less than 0");
    }

    if (numericMarks > 100) {
        throw new Error("Marks cannot be greater than 100");
    }

    if (numericMarks >= 85) return "A+";
    if (numericMarks >= 75) return "A";
    if (numericMarks >= 65) return "B";
    if (numericMarks >= 55) return "C";
    if (numericMarks >= 45) return "D";
    return "F";
};

module.exports = { calculateGrade };
