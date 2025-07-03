const express = require("express");
const { loginValidation } = require("../validation/auth");
const { validation } = require("../validation");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/login", loginValidation, validation, async (req, res) => {
  try {
    const { _id, id, name, power, type, business } = req.user;
    const payload = {
      _id,
      id,
      name,
    };
    if (power === 420 && type === "admin") payload.isAdmin = true;
    if (business) {
      payload.businessID = business._id;
      const _idStr = _id.toString();
      if (business.ownerIDs.some((id) => id.toString() === _idStr))
        payload.isOwner = true;
      if (business.staffIDs.some((id) => id.toString() === _idStr))
        payload.isStaff = true;
    }

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
