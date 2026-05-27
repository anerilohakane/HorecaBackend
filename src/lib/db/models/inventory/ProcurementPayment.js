import mongoose from "mongoose";

const procurementPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true },
    vendor: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ["Bank", "UPI", "Cash", "Cheque"],
      required: true,
    },
    referenceNumber: { type: String }, // Bank TXN ID, Cheque No, etc.
    invoiceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProcurementInvoice" }],
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Auto-generate payment number
procurementPaymentSchema.pre("save", async function (next) {
  if (!this.paymentNumber) {
    this.paymentNumber = `PAY-${Date.now()}`;
  }
  next();
});

if (mongoose.models.ProcurementPayment) {
  delete mongoose.models.ProcurementPayment;
}

export default mongoose.models.ProcurementPayment ||
  mongoose.model("ProcurementPayment", procurementPaymentSchema);
