
import mongoose from "mongoose";
const { Schema } = mongoose;

const ReturnItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String },
    condition: { type: String }, // e.g., opened, unopened, damaged
    refundAmount: { type: Number }, // optional suggested amount
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["return", "refund", "replacement"],
      required: true,
    },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who requested
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // optional: supplier for which the return applies
    items: { type: [ReturnItemSchema], required: true },
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "collected",
        "processed",
        "completed",
      ],
      default: "requested",
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    resolution: { type: String }, // e.g., refund txn id, replacement shipment id
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

ReturnRequestSchema.index({ order: 1 });
ReturnRequestSchema.index({ requester: 1 });
ReturnRequestSchema.index({ status: 1 });

const ReturnRequest =
  mongoose.models.ReturnRequest ||
  mongoose.model("ReturnRequest", ReturnRequestSchema);

export default ReturnRequest;
