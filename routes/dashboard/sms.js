const express = require("express");
const { Zone } = require("../../models");
const router = express.Router();

router.get("/zone", async (req, res) => {
  try {
    const { businessID } = req.user;
    const zones = await Zone.find({ businessID });
    return res.json({ zones });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
