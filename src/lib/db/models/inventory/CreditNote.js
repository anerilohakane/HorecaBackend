import mongoose from "mongoose";

const cnItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },
  shortageQty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  creditAmount: { type: Number, default: 0 },
});

const creditNoteSchema = new mongoose.Schema(
  {
    cnNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: ["Kaccha", "Pakka"],
      default: "Kaccha",
    },
    grnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodsReceivedNote",
    },
    grnNumber: { type: String },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
    },
    poNumber: { type: String },
    supplier: {
      id: { type: String },
      name: { type: String, required: true },
    },
    items: [cnItemSchema],
    totalCreditAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Provisional", "Confirmed", "Cancelled"],
      default: "Provisional",
    },
    generatedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    confirmedBy: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate CN number
creditNoteSchema.pre("save", async function (next) {
  if (!this.cnNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.cnNumber && latest.cnNumber.startsWith("CN-")) {
        const lastNum = parseInt(latest.cnNumber.replace("CN-", ""), 10);
        if (!isNaN(lastNum)) {
          this.cnNumber = `CN-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.cnNumber = "CN-0001";
    } catch (error) {
      return next(error);
    }
  }

  // Auto-calculate credit amounts
  this.items.forEach((item) => {
    item.creditAmount = item.shortageQty * item.unitPrice;
  });
  this.totalCreditAmount = this.items.reduce(
    (sum, item) => sum + item.creditAmount,
    0
  );

  next();
});

creditNoteSchema.index({ status: 1 });
creditNoteSchema.index({ type: 1 });
creditNoteSchema.index({ grnId: 1 });
creditNoteSchema.index({ createdAt: -1 });

if (mongoose.models.CreditNote) {
  delete mongoose.models.CreditNote;
}

export default mongoose.models.CreditNote ||
  mongoose.model("CreditNote", creditNoteSchema);
