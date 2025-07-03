const express = require("express");
const router = express.Router();

router.use("/user", require("./user"));
router.use("/business", require("./business"));
router.use("/package", require("./package"));

module.exports = router;
