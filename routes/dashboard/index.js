const express = require("express");
const router = express.Router();

router.use("/user", require("./user"));
router.use("/zone", require("./zone"));
router.use("/sub-zone", require("./sub-zone"));
router.use("/todo", require("./todo"));
router.use("/customer", require("./customer"));
router.use("/sms", require("./sms"));
router.use("/payment", require("./payment"));

module.exports = router;
