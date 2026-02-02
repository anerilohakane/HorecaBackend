import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
        type: Object, // Specifics like subscriptionId, productId
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
