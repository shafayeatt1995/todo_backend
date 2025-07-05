const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TodoSchema = new Schema(
  {
    businessID: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    user: { type: String },
    description: { type: String, required: true, trim: true },
    image: { type: Object },
    status: {
      type: String,
      enum: ["Pending", "Working", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  {
    strict: true,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Todo", TodoSchema);
