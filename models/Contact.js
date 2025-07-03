const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    packageID: { type: Schema.Types.ObjectId, ref: "Package" },
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Contact", ContactSchema);
