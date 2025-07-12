const express = require("express");
const { Zone, Customer, SubZone } = require("../../models");
const { objectID, hasOne, paginate } = require("../../utils");
const { customerCreateVal } = require("../../validation/customer");
const { validation } = require("../../validation");
const router = express.Router();

router.get("/zone", async (req, res) => {
  try {
    const { businessID } = req.user;
    const zones = await Zone.find({ businessID: objectID(businessID) });
    return res.json({ zones });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/sub-zone", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { zoneID } = req.query;
    const matchQuery = { businessID: objectID(businessID) };
    if (zoneID) matchQuery.zoneID = objectID(zoneID);
    const subZones = await SubZone.find(matchQuery);
    return res.json({ subZones });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { page, perPage, search } = req.query;

    const matchStage = {
      businessID: objectID(businessID),
    };

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      ...paginate(page, perPage),
      ...hasOne("subZoneID", "subzones", "subZone", ["name"]),
      ...hasOne("zoneID", "zones", "zone", ["name"]),
    ]);

    return res.json({ customers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/", customerCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { zoneID, subZoneID, id, name, phone, address, package } = req.body;
    const body = {
      businessID,
      zoneID,
      id,
      name,
      phone,
      address,
      package,
    };
    if (subZoneID) body.subZoneID = objectID(subZoneID);
    await Customer.create(body);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.put("/", customerCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id, zoneID, subZoneID, id, name, phone, address, package } =
      req.body;
    const body = { zoneID, id, name, phone, address, package };
    if (subZoneID) body.subZoneID = subZoneID;
    await Customer.updateOne({ _id, businessID }, body);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { customer } = req.body;
    const { businessID } = req.user;
    await Customer.deleteOne({
      _id: objectID(customer._id),
      businessID: objectID(businessID),
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
