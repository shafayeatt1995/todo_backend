const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PackageSchema = new Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    ipType: { type: String, required: true },
    price: { type: Number, required: true },
    vatType: { type: String, enum: ["fixed", "percent"], default: "fixed" },
    vatAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Package", PackageSchema);
