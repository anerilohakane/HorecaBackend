import mongoose from "mongoose";

const grnItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },
  orderedQty: { type: Number, required: true },
  receivedQty: { type: Number, required: true },
  shortageQty: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  shortageValue: { type: Number, default: 0 },
});

const goodsReceivedNoteSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, unique: true },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    poNumber: { type: String },
    supplier: {
      id: { type: String },
      name: { type: String, required: true },
    },
    items: [grnItemSchema],
    totalReceived: { type: Number, default: 0 },
    totalShortage: { type: Number, default: 0 },
    totalShortageValue: { type: Number, default: 0 },
    receivedBy: { type: String, default: "Admin" },
    receivedDate: { type: Date, default: Date.now },
    remarks: { type: String, default: "" },
    hasShortage: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate GRN number and calculate shortages
goodsReceivedNoteSchema.pre("save", async function (next) {
  if (!this.grnNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.grnNumber && latest.grnNumber.startsWith("GRN-")) {
        const lastNum = parseInt(latest.grnNumber.replace("GRN-", ""), 10);
        if (!isNaN(lastNum)) {
          this.grnNumber = `GRN-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.grnNumber = "GRN-0001";
    } catch (error) {
      return next(error);
    }
  }

  // Calculate shortage for each item
  let totalReceived = 0;
  let totalShortage = 0;
  let totalShortageValue = 0;

  this.items.forEach((item) => {
    item.shortageQty = Math.max(0, item.orderedQty - item.receivedQty);
    item.shortageValue = item.shortageQty * item.unitPrice;
    totalReceived += item.receivedQty;
    totalShortage += item.shortageQty;
    totalShortageValue += item.shortageValue;
  });

  this.totalReceived = totalReceived;
  this.totalShortage = totalShortage;
  this.totalShortageValue = totalShortageValue;
  this.hasShortage = totalShortage > 0;

  next();
});

goodsReceivedNoteSchema.index({ purchaseOrderId: 1 });
goodsReceivedNoteSchema.index({ hasShortage: 1 });
goodsReceivedNoteSchema.index({ createdAt: -1 });

if (mongoose.models.GoodsReceivedNote) {
  delete mongoose.models.GoodsReceivedNote;
}

export default mongoose.models.GoodsReceivedNote ||
  mongoose.model("GoodsReceivedNote", goodsReceivedNoteSchema);
