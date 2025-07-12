const express = require("express");
const mongoose = require("mongoose");
const { Business, User } = require("../../models");
const { paginate, objectID, imageUpload, utapi } = require("../../utils");
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
    } else if (type === "staff") {
      lookup = {
        $lookup: {
          from: "users",
          localField: "staffIDs",
          foreignField: "_id",
          as: "staffs",
        },
      };
    } else if (type === "seller") {
      lookup = {
        $lookup: {
          from: "users",
          localField: "sellerIDs",
          foreignField: "_id",
          as: "sellers",
        },
      };
    } else if (type === "reSeller") {
      lookup = {
        $lookup: {
          from: "users",
          localField: "reSellerIDs",
          foreignField: "_id",
          as: "reSellers",
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
    // await Business.deleteMany({ _id: { $in: ids } });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { business } = req.body;
    const findBusiness = await Business.findOne({
      _id: business._id,
      image: { $exists: true },
    }).lean();
    if (findBusiness?.image) await utapi.deleteFiles([findBusiness.image.key]);
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
    const { name, exp } = req.body;
    let image = null;
    if (req.files?.image?.data) {
      const upload = await imageUpload(req.files?.image?.data);
      const { key, url } = upload;
      image = { key, url };
    }
    const body = { name, exp: new Date(exp), refName };
    if (image) body.image = image;
    await Business.create(body);
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", businessCreateVal, validation, async (req, res) => {
  try {
    const { name, exp, _id } = req.body;
    let image = null;
    if (req.files?.image?.data) {
      const business = await Business.findOne({
        _id,
        image: { $exists: true },
      }).lean();
      if (business?.image) await utapi.deleteFiles([business.image.key]);

      const upload = await imageUpload(req.files?.image?.data);
      const { key, url } = upload;
      image = { key, url };
    }
    const body = { name, exp: new Date(exp) };
    if (image) body.image = image;
    await Business.updateOne({ _id }, body);
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
      !["owner", "seller", "reSeller", "staff"].includes(type) ||
      !Array.isArray(users)
    ) {
      throw new Error("Invalid request data");
    }

    const userIds = users.map(({ _id }) => objectID(_id));
    const updateField =
      type === "owner"
        ? { ownerIDs: userIds }
        : type === "seller"
        ? { sellerIDs: userIds }
        : type === "reSeller"
        ? { reSellerIDs: userIds }
        : { staffIDs: userIds };
    const userBody = {
      businessID: objectID(business._id),
      type,
    };
    if (type === "staff") userBody.permissions = [];

    await Business.updateOne({ _id: objectID(business._id) }, updateField, {
      session,
    });
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: userBody },
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
