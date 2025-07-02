const express = require("express");
const { validation } = require("../validation");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { loginValidation } = require("../validation/auth");

router.post("/login", loginValidation, validation, async (req, res) => {
  try {
    const { _id, id, name, power, type } = req.user;
    const payload = {
      _id,
      id,
      name,
    };
    if (power === 420 && type === "admin") payload.isAdmin = true;
    if (power === 10 && type === "user") payload.proUser = true;
    const token = jwt.sign(payload, process.env.AUTH_SECRET, {
      expiresIn: "30 days",
    });

    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
