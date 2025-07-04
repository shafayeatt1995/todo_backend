const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ZoneSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { strict: true }
);

module.exports = mongoose.model("Zone", ZoneSchema);
