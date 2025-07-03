const express = require("express");
const { Package } = require("../../models");
const { paginate, objectID } = require("../../utils");
const { validation } = require("../../validation");
const { packageCreateVal } = require("../../validation/package");
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

    const [packages, total] = await Promise.all([
      Package.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
        { $project: { businessID: 0 } },
      ]),
      Package.countDocuments(matchQuery),
    ]);
    return res.send({ packages, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-delete", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { ids } = req.body;
    await Package.deleteMany({
      _id: { $in: ids },
      businessID: objectID(businessID),
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { pack } = req.body;
    await Package.deleteOne({
      _id: pack._id,
      businessID: objectID(pack.businessID),
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", packageCreateVal, validation, async (req, res) => {
  try {
    const { businessID, name: refName } = req.user;
    const { name, price, id } = req.body;
    await Package.create({
      businessID,
      refName,
      id,
      name,
      price,
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", packageCreateVal, validation, async (req, res) => {
  try {
    const { businessID } = req.user;
    const { _id, name, price, id } = req.body;
    await Package.updateOne({ _id, businessID }, { name, price, id });

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
