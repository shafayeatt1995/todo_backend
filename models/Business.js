const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BusinessSchema = new Schema(
  {
    refName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    ownerIDs: { type: [Schema.Types.ObjectId], default: [], ref: "User" },
    staffIDs: { type: [Schema.Types.ObjectId], default: [], ref: "User" },
    sms: { type: Number, default: 0 },
    exp: { type: Date, default: () => Date.now() },
    image: { type: Object },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Business", BusinessSchema);
