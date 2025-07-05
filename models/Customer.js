const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CustomerSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    zoneID: { type: Schema.Types.ObjectId, ref: "zone" },
    subZoneID: { type: Schema.Types.ObjectId, ref: "subZone" },
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    package: { type: String, trim: true },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Customer", CustomerSchema);
