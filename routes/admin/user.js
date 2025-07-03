const express = require("express");
const { User } = require("../../models");
const { paginate, sleep, toggle } = require("../../utils");
const { userCreateVal, userEditVal } = require("../../validation/user");
const { validation } = require("../../validation");
const router = express.Router();

router.post("/fetch", async (req, res) => {
  try {
    const { page, perPage, keyword, searchBy, sort } = req.body;
    const matchQuery = {};
    if (keyword) matchQuery[searchBy] = { $regex: keyword, $options: "i" };

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
    const { _id } = req.user;
    const { user } = req.body;
    await User.updateOne(
      { $and: [{ _id: user._id }, { _id: { $ne: _id } }] },
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
    const { _id } = req.user;
    const { ids, suspend } = req.body;
    await User.updateMany(
      { _id: { $in: ids, $ne: _id } },
      { suspended: suspend }
    );
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/batch-delete", async (req, res) => {
  try {
    const { _id } = req.user;
    const { ids } = req.body;
    await User.deleteMany({ _id: { $in: ids, $ne: _id } });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/delete", async (req, res) => {
  try {
    const { _id } = req.user;
    const { user } = req.body;
    await User.deleteOne({ $and: [{ _id: user._id }, { _id: { $ne: _id } }] });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", userCreateVal, validation, async (req, res) => {
  try {
    const { name: refName } = req.user;
    const { name, id, password, mobile, type } = req.body;
    await User.create({
      name,
      id,
      password,
      pass: password,
      mobile,
      type,
      refName,
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/edit", userEditVal, validation, async (req, res) => {
  try {
    const { name, id, password, mobile, type, _id } = req.body;
    const body = { name, id, mobile, type };
    if (password) {
      body.password = password;
      body.pass = password;
    }
    await User.updateOne({ _id }, body);

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
