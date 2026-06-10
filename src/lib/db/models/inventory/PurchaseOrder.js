import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },
  orderedQty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    supplier: {
      id: { type: String },
      name: { type: String, required: true },
    },
    items: [poItemSchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Sent", "Partial Received", "Closed", "Completed", "Cancelled"],
      default: "Draft",
    },
    prId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequest" },
    timeline: [
      {
        status: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        user: String,
      },
    ],
    expectedDeliveryDate: { type: Date },
    createdBy: { type: String, default: "Admin" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate PO number
purchaseOrderSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.poNumber && latest.poNumber.startsWith("PO-")) {
        const lastNum = parseInt(latest.poNumber.replace("PO-", ""), 10);
        if (!isNaN(lastNum)) {
          this.poNumber = `PO-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.poNumber = "PO-0001";
    } catch (error) {
      return next(error);
    }
  }

  // Auto-calculate totals
  this.items.forEach((item) => {
    item.totalPrice = item.orderedQty * item.unitPrice;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  next();
});

purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ "supplier.name": 1 });
purchaseOrderSchema.index({ createdAt: -1 });

if (mongoose.models.PurchaseOrder) {
  delete mongoose.models.PurchaseOrder;
}

export default mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", purchaseOrderSchema);
