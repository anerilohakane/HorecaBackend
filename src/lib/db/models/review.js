
import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true }, // Verified purchase
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String] }, // Array of image URLs
    isApproved: { type: Boolean, default: true }, // Auto-approve by default, set false if you want moderation
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews for the same product in the same order by the same user
ReviewSchema.index({ order: 1, product: 1, user: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
