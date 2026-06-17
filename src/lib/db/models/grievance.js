import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: String, // Store customer id
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    category: {
      type: String,
      enum: [
        "Delivery Delay",
        "Product Quality Issue",
        "Missing Item",
        "Wrong Product",
        "Payment Issue",
        "Other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Open",
        "Assigned",
        "In Progress",
        "Waiting for Customer Response",
        "Resolved",
        "Closed",
        "Escalated",
      ],
      default: "Open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ priority: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ assignedTo: 1 });
grievanceSchema.index({ dueAt: 1 });

export default mongoose.models.Grievance ||
  mongoose.model("Grievance", grievanceSchema);
