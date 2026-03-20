import mongoose from "mongoose";

const restockRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "notified"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending requests for the same user and product
restockRequestSchema.index({ user: 1, product: 1, status: 1 }, { unique: true });

export default mongoose.models.RestockRequest || mongoose.model("RestockRequest", restockRequestSchema);
