const express = require("express");
const { Zone } = require("../../models");
const { paginate, objectID } = require("../../utils");
const { validation } = require("../../validation");
const { zoneCreateVal } = require("../../validation/zone");
const router = express.Router();

router.post("/fetch", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { page, perPage, keyword, searchBy, sort } = req.body;
    const matchQuery = {
      $and: [
        { businessID: objectID(businessID) },
        ...(keyword
          ? [{ [searchBy]: { $regex: keyword, $options: "i" } }]
          : []),
      ],
    };

    const [zones, total] = await Promise.all([
      Zone.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
        { $project: { businessID: 0 } },
      ]),
      Zone.countDocuments(matchQuery),
    ]);
    return res.send({ zones, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id } = req.body;
    await Zone.deleteOne({ _id, businessID });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", zoneCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { name } = req.body;
    await Zone.create({ businessID, name });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", zoneCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id, name } = req.body;
    await Zone.updateOne({ _id, businessID }, { name });

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
