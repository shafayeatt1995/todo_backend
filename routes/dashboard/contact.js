const express = require("express");
const { Package, Contact } = require("../../models");
const { objectID, hasOne, paginate } = require("../../utils");
const { contactCreateVal } = require("../../validation/contact");
const { validation } = require("../../validation");
const router = express.Router();

router.get("/package", async (req, res) => {
  try {
    const { businessID } = req.user;
    const packages = await Package.find({ businessID: objectID(businessID) });
    return res.json({ packages });
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

    const contacts = await Contact.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      ...paginate(page, perPage),
      ...hasOne("packageID", "packages", "package", ["name", "price"]),
    ]);

    return res.json({ contacts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/", contactCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { packageID, id, name, phone, address } = req.body;
    await Contact.create({
      businessID,
      packageID,
      id,
      name,
      phone,
      address,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.put("/", contactCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id, packageID, id, name, phone, address } = req.body;
    await Contact.updateOne(
      { _id, businessID },
      { packageID, id, name, phone, address }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { contact } = req.body;
    const { businessID } = req.user;
    await Contact.deleteOne({
      _id: objectID(contact._id),
      businessID: objectID(businessID),
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
