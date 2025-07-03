const express = require("express");
const { Package } = require("../../models");
const { paginate } = require("../../utils");
const { validation } = require("../../validation");
const { packageCreateVal } = require("../../validation/package");
const router = express.Router();

router.post("/fetch", async (req, res) => {
  try {
    const { page, perPage, keyword, searchBy, sort } = req.body;
    const matchQuery = {};
    if (keyword) matchQuery[searchBy] = { $regex: keyword, $options: "i" };

    const [packages, total] = await Promise.all([
      Package.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
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
    const { ids } = req.body;
    await Package.deleteMany({ _id: { $in: ids }, refName: "admin" });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { pack } = req.body;
    await Package.deleteOne({ _id: pack._id, refName: "admin" });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", packageCreateVal, validation, async (req, res) => {
  try {
    const { _id: userID, name: refName } = req.user;
    const { name, ipType, price, vatType, vatAmount } = req.body;
    await Package.create({
      userID,
      refName,
      name,
      ipType,
      price,
      vatType,
      vatAmount,
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", packageCreateVal, validation, async (req, res) => {
  try {
    const { _id, name, ipType, price, vatType, vatAmount } = req.body;
    await Package.updateOne(
      { _id },
      { name, ipType, price, vatType, vatAmount }
    );

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
