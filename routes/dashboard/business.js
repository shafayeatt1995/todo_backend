const express = require("express");
const mongoose = require("mongoose");
const { Business, User } = require("../../models");
const { paginate, objectID } = require("../../utils");
const { validation } = require("../../validation");
const { businessCreateVal } = require("../../validation/business");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { business, type } = req.body;
    let lookup = {};
    if (type === "owner") {
      lookup = {
        $lookup: {
          from: "users",
          localField: "ownerIDs",
          foreignField: "_id",
          as: "owners",
        },
      };
    } else {
      lookup = {
        $lookup: {
          from: "users",
          localField: "staffIDs",
          foreignField: "_id",
          as: "staffs",
        },
      };
    }
    const [item] = await Business.aggregate([
      { $match: { _id: objectID(business._id) } },
      { $limit: 1 },
      lookup,
    ]);
    return res.json({ business: item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/fetch", async (req, res) => {
  try {
    const { page, perPage, keyword, searchBy, sort } = req.body;
    const matchQuery = {};
    if (keyword) matchQuery[searchBy] = { $regex: keyword, $options: "i" };

    const [businesses, total] = await Promise.all([
      Business.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
      ]),
      Business.countDocuments(matchQuery),
    ]);
    return res.send({ businesses, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    await Business.deleteMany({ _id: { $in: ids } });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { business } = req.body;
    await Business.deleteOne({ _id: business._id });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", businessCreateVal, validation, async (req, res) => {
  try {
    const { name: refName } = req.user;
    const { name, expire } = req.body;
    await Business.create({ name, refName, exp: new Date(expire) });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", businessCreateVal, validation, async (req, res) => {
  try {
    const { name, expire, _id } = req.body;
    await Business.updateOne({ _id }, { name, exp: new Date(expire) });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/search-user", async (req, res) => {
  try {
    const { id } = req.query;
    let users = [];
    if (!id || typeof id !== "string" || !id.trim()) return res.json({ users });
    users = await User.aggregate([
      {
        $match: {
          id: { $regex: id, $options: "i" },
          suspended: false,
          businessID: { $exists: false },
          type: { $ne: "admin" },
        },
      },
      { $limit: 30 },
      { $project: { avatar: 1, id: 1, name: 1 } },
    ]);
    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/update-user", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { business, type, users } = req.body;

    if (
      !business?._id ||
      !["owner", "staff"].includes(type) ||
      !Array.isArray(users)
    ) {
      throw new Error("Invalid request data");
    }

    const userIds = users.map(({ _id }) => objectID(_id));

    const updateField =
      type === "owner" ? { ownerIDs: userIds } : { staffIDs: userIds };

    await Business.updateOne({ _id: objectID(business._id) }, updateField, {
      session,
    });
    await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          businessID: objectID(business._id),
          type,
        },
      },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    await session.endSession();
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
