const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { userRoles } = require("../utils/payload");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    suspended: { type: Boolean, default: false, select: false },
    power: { type: Number, default: 1, select: false },
    type: {
      type: String,
      required: true,
      enum: userRoles,
      default: "user",
    },
    fcmToken: { type: String, select: false },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("User", UserSchema);
