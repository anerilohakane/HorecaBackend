import mongoose from "mongoose";
const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    frequency: {
      type: String,
      enum: ["Weekly", "Monthly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Cancelled"],
      default: "Active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    nextOrderDate: {
      type: Date,
      required: true,
    },
    lastOrderDate: {
      type: Date,
    },
    // Snapshot of product details for display if product is deleted
    productName: { type: String },
    productImage: { type: String },
    deviceToken: { type: String }, // For push notifications
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ nextOrderDate: 1 });

const Subscription =
  mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;
