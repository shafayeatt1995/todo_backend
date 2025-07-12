const express = require("express");
const { Zone, SubZone, Customer } = require("../../models");
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
router.post("/sub-zone", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { zones } = req.body;
    let subZones = [];
    if (zones && zones.length > 0) {
      const matchQuery = { businessID };
      matchQuery.zoneID = { $in: zones };
      subZones = await SubZone.find(matchQuery).lean();
    }
    return res.json({ subZones });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.post("/custom", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { message, type, zone, subZone } = req.body;
    if (type === "all") {
      const customers = await Customer.find({ businessID }).lean();
      console.log(customers.map(({ name, phone }) => ({ name, phone })));
    } else if (type === "zone") {
      const matchQuery = { businessID };
      if (zone && zone.length) matchQuery.zoneID = { $in: zone };
      if (subZone && subZone.length) matchQuery.subZoneID = { $in: subZone };
      console.log(matchQuery);
      const customers = await Customer.find(matchQuery).lean();
      console.log(customers.map(({ name, phone }) => ({ name, phone })));
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
