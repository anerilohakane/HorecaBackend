import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true, trim: true },
    productName: { type: String, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", index: true },
    warehouseLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "WarehouseLocation", index: true },
    currentStock: { type: Number, default: 0, min: 0, index: true },
    minThreshold: { type: Number, default: 0, min: 0 },
    dailyUsage: { type: Number, default: 0, min: 0 },
    leadTimeDays: { type: Number, default: 7, min: 0 },
    lastMovementDate: { type: Date, default: null, index: true },
    expiryDate: { type: Date, default: null, index: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    aiInsights: {
      predictedDemand: { type: Number, default: 0 },
      recommendedStockLevel: { type: Number, default: 0 },
      stockoutDate: { type: Date, default: null },
      urgencyLevel: { type: String, default: "low" },
      lossRisk: { type: String, default: "low" },
      recommendedAction: { type: String, default: "Monitor stock movement" },
    },
  },
  { timestamps: true }
);

inventorySchema.index({ currentStock: 1, leadTimeDays: 1 });
inventorySchema.index({ expiryDate: 1, lastMovementDate: 1 });

export default mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
