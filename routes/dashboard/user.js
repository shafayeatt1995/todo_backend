const express = require("express");
const mongoose = require("mongoose");
const { User, Business, Package } = require("../../models");
const { paginate, sleep, toggle, objectID } = require("../../utils");
const { userCreateVal, userEditVal } = require("../../validation/user");
const { validation } = require("../../validation");
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

    const [users, total] = await Promise.all([
      User.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
        {
          $project: {
            avatar: 1,
            createdAt: 1,
            id: 1,
            mobile: 1,
            name: 1,
            suspended: 1,
            type: 1,
            refName: 1,
            permissions: 1,
          },
        },
      ]),
      User.countDocuments(matchQuery),
    ]);

    return res.send({ users, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/toggle-suspend", async (req, res) => {
  try {
    const { businessID, _id } = req.user;
    const { user } = req.body;
    await User.updateOne(
      {
        $and: [
          { _id: objectID(user._id) },
          { _id: { $ne: _id } },
          { businessID: objectID(businessID) },
        ],
      },
      toggle("suspended")
    );
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-toggle-suspend", async (req, res) => {
  try {
    const { businessID, _id } = req.user;
    const { ids, suspend } = req.body;
    await User.updateMany(
      {
        $and: [
          { _id: { $in: ids, $ne: _id } },
          { businessID: objectID(businessID) },
        ],
      },
      { suspended: suspend }
    );
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-delete", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { _id, businessID } = req.user;
    const { ids } = req.body;
    for (const id of ids) {
      if (_id !== id) {
        const user = await User.findOneAndDelete(
          {
            $and: [{ _id: objectID(id) }, { businessID: objectID(businessID) }],
          },
          { session }
        );
        await Business.updateOne(
          { _id: objectID(businessID) },
          { $pull: { [user.type + "IDs"]: objectID(id) } },
          { session }
        );
      }
    }
    await session.commitTransaction();
    await session.endSession();
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    await session.endSession();
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { _id, businessID } = req.user;
    const { user } = req.body;
    if (_id !== user._id) {
      await User.deleteOne(
        {
          $and: [
            { _id: objectID(user._id) },
            { businessID: objectID(businessID) },
          ],
        },
        { session }
      );
      await Business.updateOne(
        { _id: objectID(businessID) },
        { $pull: { [user.type + "IDs"]: objectID(user._id) } },
        { session }
      );
    }

    await session.commitTransaction();
    await session.endSession();
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    await session.endSession();
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", userCreateVal, validation, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name: refName, businessID } = req.user;
    const { name, id, password } = req.body;
    const [user] = await User.create(
      [
        {
          name,
          id,
          password,
          type: "staff",
          refName,
          businessID,
        },
      ],
      { session }
    );
    await Business.updateOne(
      { _id: objectID(businessID) },
      { $push: { staffIDs: objectID(user._id) } },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    await session.endSession();
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", userEditVal, validation, async (req, res) => {
  try {
    const { name, id, password, _id } = req.body;
    const body = { name, id };
    if (password) {
      body.password = password;
    }
    await User.updateOne({ _id }, body);

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/update-permission", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { permissions, _id } = req.body?.user;
    await User.updateOne(
      {
        $and: [{ businessID: objectID(businessID) }, { _id: objectID(_id) }],
      },
      { permissions }
    );

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/package", async (req, res) => {
  try {
    const { _id } = req.user;
    const packages = await Package.find({ userID: objectID(_id) });
    return res.send({ packages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
