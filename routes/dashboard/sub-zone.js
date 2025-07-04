const express = require("express");
const { SubZone, Zone } = require("../../models");
const { paginate, objectID, hasOne } = require("../../utils");
const { validation } = require("../../validation");
const { subZoneCreateVal } = require("../../validation/sub-zone");
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
      SubZone.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
        ...hasOne("zoneID", "zones", "zone", ["name"]),
      ]),
      SubZone.countDocuments(matchQuery),
    ]);
    return res.send({ zones, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/zone", async (req, res) => {
  try {
    const { businessID } = req.user;
    const zones = await Zone.find({ businessID: objectID(businessID) });
    return res.send({ zones });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id } = req.body;
    await SubZone.deleteOne({ _id, businessID });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", subZoneCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { name, zoneID } = req.body;
    await SubZone.create({ businessID, name, zoneID });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", subZoneCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id, name, zoneID } = req.body;
    await SubZone.updateOne({ _id, businessID }, { name, zoneID });

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
