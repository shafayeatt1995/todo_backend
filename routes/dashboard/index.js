const express = require("express");
const router = express.Router();

router.use("/user", require("./user"));
router.use("/zone", require("./zone"));
router.use("/todo", require("./todo"));
router.use("/customer", require("./customer"));

module.exports = router;
