const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const { Business } = require("../models");

router.get("/anik", async (req, res) => {
  try {
    return res.send("Hello World!");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.use("/webhook", require("./webhook"));
router.use("/auth", require("./auth"));

router.use(isAuthenticated);
router.use("/user", require("./user"));
router.use("/dashboard", require("./dashboard"));

router.use(isAdmin);
router.use("/admin", require("./admin"));

module.exports = router;
