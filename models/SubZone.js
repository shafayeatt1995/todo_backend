const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubZoneSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    zoneID: {
      type: Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { strict: true }
);

module.exports = mongoose.model("SubZone", SubZoneSchema);
