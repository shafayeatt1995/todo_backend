const express = require("express");
const { paginate, objectID } = require("../../utils");
const { Subscription } = require("../../models");
const router = express.Router();

router.post("/", async (req, res) => {
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

    const [purchases, total] = await Promise.all([
      Subscription.aggregate([
        { $match: matchQuery },
        { $sort: sort },
        ...paginate(page, perPage),
        { $project: { businessID: 0 } },
      ]),
      Subscription.countDocuments(matchQuery),
    ]);
    return res.send({ purchases, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
