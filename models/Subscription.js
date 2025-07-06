const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    trxID: { type: String, required: true },
    status: { type: String, required: true },
    amount: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    payerNumber: { type: String, required: true },
    package: { type: String, required: true },
    sms: { type: Number, required: true },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
