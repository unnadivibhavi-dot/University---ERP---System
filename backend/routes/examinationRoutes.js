const express = require("express");
const router = express.Router();

const {
    getAllExaminations,
    getExaminationById,
    createExamination,
    updateExamination,
    deleteExamination
} = require("../controllers/examinationController");

router.get("/", getAllExaminations);
router.get("/:id", getExaminationById);
router.post("/", createExamination);
router.put("/:id", updateExamination);
router.delete("/:id", deleteExamination);

module.exports = router;
