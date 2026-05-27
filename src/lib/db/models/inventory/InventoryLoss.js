import mongoose from "mongoose";

const inventoryLossSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, default: "" },
    category: { type: String, default: "Uncategorized" },
    reason: {
      type: String,
      enum: ["Non-Moving", "Expired", "Damaged", "Shrinkage", "Other"],
      default: "Non-Moving",
    },
    lossQuantity: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, default: 0 },
    lossValue: { type: Number, default: 0 },
    detectedAt: { type: Date, default: Date.now },
    lastMovementDate: { type: Date },
    daysSinceMovement: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Detected", "Acknowledged", "Written-Off"],
      default: "Detected",
    },
    notes: { type: String, default: "" },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    writtenOffBy: { type: String },
    writtenOffAt: { type: Date },
  },
  { timestamps: true }
);

inventoryLossSchema.index({ status: 1 });
inventoryLossSchema.index({ reason: 1 });
inventoryLossSchema.index({ detectedAt: -1 });
inventoryLossSchema.index({ productId: 1 });

if (mongoose.models.InventoryLoss) {
  delete mongoose.models.InventoryLoss;
}

export default mongoose.models.InventoryLoss ||
  mongoose.model("InventoryLoss", inventoryLossSchema);
