const express = require("express");
const { Zone } = require("../../models");
const { paginate } = require("../../utils");
const { validation } = require("../../validation");
const { zoneCreateVal } = require("../../validation/zone");
const router = express.Router();

router.post("/fetch", async (req, res) => {
  try {
    const { page, perPage, keyword, searchBy, sort } = req.body;
    const matchQuery = {};
    if (keyword) matchQuery[searchBy] = { $regex: keyword, $options: "i" };

    const [zones, total] = await Promise.all([
      Zone.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
      ]),
      Zone.countDocuments(matchQuery),
    ]);
    return res.send({ zones, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    await Zone.deleteMany({ _id: { $in: ids }, refName: "admin" });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { zone } = req.body;
    await Zone.deleteOne({ _id: zone._id, refName: "admin" });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", zoneCreateVal, validation, async (req, res) => {
  try {
    const { _id: userID, name: refName } = req.user;
    const { name } = req.body;
    await Zone.create({
      userID,
      refName,
      name,
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", zoneCreateVal, validation, async (req, res) => {
  try {
    const { _id, name } = req.body;
    await Zone.updateOne({ _id }, { name });

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
