const express = require("express");
const { generatePaymentUrl } = require("../../utils/bkash");
const { packages } = require("../../utils/payload");
const router = express.Router();

router.post("/purchase", async (req, res) => {
  try {
    const { businessID } = req.user;
    const { packID } = req.body;
    const pack = packages.find((pack) => pack.id === packID);
    const url = await generatePaymentUrl(pack, businessID);
    return res.json({ url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
