const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Todo } = require("../../models");
const { userCreateVal, userEditVal } = require("../../validation/user");
const { validation } = require("../../validation");
const {
  toggle,
  utapi,
  randomKey,
  paginate,
  hasOne,
  addDate,
} = require("../../utils");
const sharp = require("sharp");
const { todoCreateVal } = require("../../validation/todo");
const { admin } = require("../../utils/firebaseAdmin");
const router = express.Router();

router.get("/user", async (req, res) => {
  try {
    const items = await User.aggregate([
      { $sort: { _id: -1 } },
      {
        $project: {
          password: 0,
          power: 0,
          fcmToken: 0,
        },
      },
    ]);
    return res.send({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.post("/user", userCreateVal, validation, async (req, res) => {
  try {
    const { name, id, password } = req.body;
    await User.create({
      name,
      id,
      password,
    });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.put("/user", userEditVal, validation, async (req, res) => {
  try {
    const { name, id, password, _id } = req.body;
    const body = { name, id };
    if (password) body.password = bcrypt.hashSync(password, 10);
    await User.updateOne({ _id }, body);

    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/user/toggle-suspend", async (req, res) => {
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
router.post("/user/delete", async (req, res) => {
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
router.get("/todo", async (req, res) => {
  try {
    const { page, perPage } = req.query;
    const items = await Todo.aggregate([
      { $sort: { _id: -1 } },
      ...paginate(page, perPage),
    ]);
    return res.send({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.post("/todo", todoCreateVal, validation, async (req, res) => {
  let keyList = null;
  try {
    const imageBuffer = req.files?.image?.data;
    let image = null;
    if (imageBuffer) {
      const metadata = await sharp(imageBuffer).metadata();
      const shouldResize = metadata.width > 2000 || metadata.height > 2000;
      const webpBuffer = shouldResize
        ? await sharp(imageBuffer)
            .resize({
              width: 2000,
              height: 2000,
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            })
            .webp({ quality: 90 })
            .toBuffer()
        : await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();

      const filename = `${randomKey(5)}`;
      const blob = new Blob([webpBuffer], {
        type: "application/octet-stream",
      });
      const uploadData = Object.assign(blob, { name: filename });

      const { data } = await utapi.uploadFiles(uploadData);
      const { key, url, size } = data;
      image = { key, url, size };
      keyList = key;
    }

    const { name, _id } = req.user;
    const { title, description } = req.body;
    const payload = { title, description, user: name };
    if (image) payload.image = image;
    await Todo.create(payload);

    // 🔔 Send push notification to all users except the sender
    const users = await User.find({ fcmToken: { $exists: true } }).lean();

    const tokens = users.map((u) => u.fcmToken);

    if (tokens.length > 0) {
      await admin.messaging().sendToDevice(tokens, {
        notification: {
          title: `🆕 New Todo Added by ${name}`,
          body: `${title}`,
          icon: "https://todo-frontend-ofl4.onrender.com/logo.png",
          click_action: "https://todo-frontend-ofl4.onrender.com",
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    if (keyList) {
      await utapi.deleteFiles([keyList]);
    }
    return res
      .status(500)
      .json({ success: false, message: "Something wrong. Please try again" });
  }
});
router.put("/todo", todoCreateVal, validation, async (req, res) => {
  try {
    const { _id, title, description } = req.body;
    await Todo.updateOne({ _id }, { title, description });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Something wrong. Please try again" });
  }
});
router.post("/todo/update-status", async (req, res) => {
  try {
    const { todo, status } = req.body;
    await Todo.updateOne({ _id: todo._id }, { status });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/todo/delete", async (req, res) => {
  try {
    const { todo } = req.body;
    if (!todo) return res.send({ success: false });
    if (todo.image) {
      await utapi.deleteFiles([todo.image.key]);
    }
    await Todo.deleteOne({ _id: todo._id });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/clean-image", async (req, res) => {
  try {
    const matchQuery = {
      createdAt: { $gte: addDate(30, new Date()) },
      image: { $exists: true },
    };
    const todos = await Todo.find(matchQuery).lean();
    const key = todos
      .filter((todo) => todo.image?.key || false)
      .map((todo) => todo.image.key);
    if (key && key.length) {
      await utapi.deleteFiles(key);
    }
    await Todo.updateMany(matchQuery, { $unset: { image: "" } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add-fcm", async (req, res) => {
  try {
    const { token } = req.body;
    await User.updateOne({ _id: req.user._id }, { $set: { fcmToken: token } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/check-fcm", async (req, res) => {
  try {
    const { name, _id } = req.user;
    const users = await User.find({
      _id: { $ne: _id },
      fcmToken: { $exists: true },
    })
      .select({ fcmToken: 1 })
      .lean();
    const tokens = users.map((u) => u.fcmToken);
    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `Test Notification`,
          body: `Hi, I'm ${name}, testing push notification`,
        },
        webpush: {
          notification: {
            icon: "https://todo-frontend-ofl4.onrender.com/logo.png",
            click_action: "https://todo-frontend-ofl4.onrender.com",
          },
        },
      });
      console.log(response.responses[0].error, "anik");
    }
    return res.json({ success: true, tokens });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
