const express = require("express");
const router = express.Router();

router.use("/user", require("./user"));
router.use("/package", require("./package"));
router.use("/todo", require("./todo"));
router.use("/contact", require("./contact"));

module.exports = router;
