const express = require("express");
const { executePayment } = require("../utils/bkash");
const { Subscription, Business } = require("../models");
const { addMonth } = require("../utils");
const router = express.Router();

router.post("/bkash/verify-payment", async (req, res) => {
  try {
    const { paymentID } = req.body;
    const data = await executePayment(paymentID);
    const { name, sms, bonus, businessID } = JSON.parse(data.payerReference);
    const {
      trxID,
      transactionStatus,
      amount,
      merchantInvoiceNumber,
      customerMsisdn,
    } = data;
    const totalSMS = (+sms || 0) + (+bonus || 0);
    await Subscription.create({
      businessID,
      trxID,
      status: transactionStatus,
      amount,
      invoiceNumber: merchantInvoiceNumber,
      payerNumber: customerMsisdn,
      package: name,
      sms: totalSMS,
    });
    await Business.updateOne(
      { _id: businessID },
      { $inc: { sms: totalSMS }, exp: addMonth(1) }
    );
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
