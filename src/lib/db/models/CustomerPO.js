import mongoose from "mongoose";

const customerPOItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  sku: { type: String, default: "" },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 },
});

const customerPOSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" }, // Optional
    items: [customerPOItemSchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    timeline: [
      {
        status: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        user: String,
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate PO number
customerPOSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.poNumber && latest.poNumber.startsWith("CPO-")) {
        const lastNum = parseInt(latest.poNumber.replace("CPO-", ""), 10);
        if (!isNaN(lastNum)) {
          this.poNumber = `CPO-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.poNumber = "CPO-0001";
    } catch (error) {
      return next(error);
    }
  }

  // Auto-calculate totals
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  next();
});

customerPOSchema.index({ status: 1 });
customerPOSchema.index({ customer: 1 });
customerPOSchema.index({ createdAt: -1 });

if (mongoose.models.CustomerPO) {
  delete mongoose.models.CustomerPO;
}

export default mongoose.models.CustomerPO ||
  mongoose.model("CustomerPO", customerPOSchema);
