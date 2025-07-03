const express = require("express");
const { Todo, User } = require("../../models");
const { paginate, objectID, randomKey, utapi } = require("../../utils");
const { todoCreateVal } = require("../../validation/todo");
const { validation } = require("../../validation");
const sharp = require("sharp");
const { admin } = require("../../utils/firebaseAdmin");
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

    const [items, total] = await Promise.all([
      Todo.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
      ]),
      Todo.countDocuments(matchQuery),
    ]);

    return res.send({ items, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
router.post("/add", todoCreateVal, validation, async (req, res) => {
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
      const { key, url } = data;
      image = { key, url };
      keyList = key;
    }

    const { name, _id, businessID } = req.user;
    const { title, description } = req.body;
    const payload = { title, description, user: name, businessID };
    if (image) payload.image = image;
    await Todo.create(payload);

    const users = await User.find({
      _id: { $ne: _id },
      businessID: objectID(businessID),
      fcmToken: { $exists: true },
    })
      .select({ fcmToken: 1 })
      .lean();
    const tokens = users.map((u) => u.fcmToken);
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `New Complain`,
          body: title,
        },
        webpush: {
          notification: {
            icon: "https://todo-frontend-ofl4.onrender.com/logo.png",
            click_action: "https://todo-frontend-ofl4.onrender.com",
          },
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
router.put("/update", todoCreateVal, validation, async (req, res) => {
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
router.post("/update-status", async (req, res) => {
  try {
    const { todo, status } = req.body;
    await Todo.updateOne({ _id: todo._id }, { status });
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
