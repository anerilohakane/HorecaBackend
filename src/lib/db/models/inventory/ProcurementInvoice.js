import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
});

const procurementInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    grnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodsReceivedNote",
      required: true,
    },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    supplier: {
      id: { type: String },
      name: { type: String, required: true },
    },
    invoiceDate: { type: Date, required: true },
    items: [invoiceItemSchema],
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Matched", "Mismatch", "Pakka"],
      default: "Pending",
    },
    matchingDetails: {
      isMatched: { type: Boolean, default: false },
      mismatches: [
        {
          field: String,
          expected: mongoose.Schema.Types.Mixed,
          actual: mongoose.Schema.Types.Mixed,
          itemIndex: Number,
        },
      ],
    },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

procurementInvoiceSchema.pre("save", function (next) {
  this.subTotal = this.items.reduce((sum, item) => sum + item.totalAmount, 0);
  this.taxTotal = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  this.grandTotal = this.subTotal + this.taxTotal;
  next();
});

if (mongoose.models.ProcurementInvoice) {
  delete mongoose.models.ProcurementInvoice;
}

export default mongoose.models.ProcurementInvoice ||
  mongoose.model("ProcurementInvoice", procurementInvoiceSchema);
