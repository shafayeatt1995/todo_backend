const express = require("express");
const router = express.Router();
const { User, Business } = require("../models");
const { sendError, message } = require("../utils");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await User.findOne({ _id, suspended: false })
      .select({ fcmToken: 0 })
      .lean();
    const body = { user: { ...user, ...req.user } };
    if (user.businessID) {
      const business = await Business.findOne({ _id: user.businessID })
        .select({ ownerIDs: 0, staffIDs: 0 })
        .lean();
      body.user.business = business;
    }
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.send(body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.get("/refresh-token", async (req, res) => {
  try {
    const bearer = req.headers.authorization || "";
    if (!bearer) return sendError({ message: "token not found" });
    const oldToken =
      bearer.split(" ")[0].toLowerCase() === "bearer"
        ? bearer.split(" ")[1]
        : null;

    const validateToken = jwt.verify(oldToken, process.env.AUTH_SECRET);
    if (!validateToken) throw new Error(`token isn't valid`);
    const user = await User.findOne({ _id: validateToken._id }).select(
      "+power"
    );
    let business = null;
    if (user.businessID) {
      business = await Business.findOne({
        _id: user.businessID,
        exp: { $gte: new Date() },
      }).lean();
    }
    const { _id, id, name, power, type } = user;

    const payload = {
      _id,
      id,
      name,
    };

    if (power === 420 && type === "admin") payload.isAdmin = true;
    if (business) {
      payload.businessID = business._id;
      const _idStr = _id.toString();
      if (business.staffIDs.some((id) => id.toString() === _idStr)) {
        payload.isStaff = true;
      } else if (business.reSellerIDs.some((id) => id.toString() === _idStr)) {
        payload.isReSeller = true;
      } else if (business.sellerIDs.some((id) => id.toString() === _idStr)) {
        payload.isSeller = true;
      } else if (business.ownerIDs.some((id) => id.toString() === _idStr)) {
        payload.isOwner = true;
      }
    }

    const token = jwt.sign(payload, process.env.AUTH_SECRET, {
      expiresIn: "30 days",
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message });
  }
});

module.exports = router;
