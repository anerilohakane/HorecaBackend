import mongoose from "mongoose";

const prnItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },
  quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  unitPrice: { type: Number, required: true },
  reason: { type: String, required: true },
});

const purchaseReturnNoteSchema = new mongoose.Schema(
  {
    prnNumber: { type: String, unique: true },
    grnId: { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceivedNote", required: true },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    items: [prnItemSchema],
    requestedBy: { type: String, required: true },
    remarks: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Rejected", "Completed"],
      default: "Draft",
    },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "WarehouseLocation" },
    locationPath: { type: String },
  },
  { timestamps: true }
);

purchaseReturnNoteSchema.pre("save", async function (next) {
  if (!this.prnNumber) {
    try {
      const latest = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
      if (latest && latest.prnNumber && latest.prnNumber.startsWith("PRN-")) {
        const lastNum = parseInt(latest.prnNumber.replace("PRN-", ""), 10);
        if (!isNaN(lastNum)) {
          this.prnNumber = `PRN-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.prnNumber = "PRN-0001";
    } catch (err) {
      return next(err);
    }
  }
  next();
});

if (mongoose.models.PurchaseReturnNote) {
  delete mongoose.models.PurchaseReturnNote;
}

export default mongoose.models.PurchaseReturnNote ||
  mongoose.model("PurchaseReturnNote", purchaseReturnNoteSchema);
