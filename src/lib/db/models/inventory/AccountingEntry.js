import mongoose from "mongoose";

const accountingEntrySchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    referenceId: { type: String, required: true }, // Invoice ID or Payment ID
    referenceType: {
      type: String,
      enum: ["ProcurementInvoice", "ProcurementPayment"],
      required: true,
    },
    transactionDate: { type: Date, default: Date.now },
    entries: [
      {
        accountName: { type: String, required: true }, // e.g., "Inventory", "GST Input", "Vendor Payable"
        accountType: { type: String, enum: ["Asset", "Liability", "Expense", "Income"] },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
      },
    ],
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Posted"],
      default: "Draft",
    },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Auto-generate transaction ID
accountingEntrySchema.pre("save", async function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  this.totalDebit = this.entries.reduce((sum, e) => sum + e.debit, 0);
  this.totalCredit = this.entries.reduce((sum, e) => sum + e.credit, 0);
  next();
});

if (mongoose.models.AccountingEntry) {
  delete mongoose.models.AccountingEntry;
}

export default mongoose.models.AccountingEntry ||
  mongoose.model("AccountingEntry", accountingEntrySchema);
