const express = require("express");
const router = express.Router();
const { User, Business } = require("../models");

router.get("/", async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await User.findOne({ _id, suspended: false }).lean();
    const body = { user: { ...user, ...req.user } };
    if (user.businessID) {
      const business = await Business.findOne({ _id: user.businessID })
        .select({ ownerIDs: 0, resellerIDs: 0 })
        .lean();
      body.user.business = business;
    }
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.send(body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
