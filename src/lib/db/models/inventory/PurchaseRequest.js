import mongoose from "mongoose";

const prItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "pcs" },
  remarks: { type: String, default: "" },
});

const purchaseRequestSchema = new mongoose.Schema(
  {
    prNumber: { type: String, unique: true },
    department: { type: String, required: true },
    items: [prItemSchema],
    requiredDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Rejected"],
      default: "Draft",
    },
    requestedBy: { type: String, default: "Admin" },
    approvalDetails: {
      approvedBy: { type: String },
      approvedAt: { type: Date },
      comments: { type: String },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-generate PR number
purchaseRequestSchema.pre("save", async function (next) {
  if (!this.prNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.prNumber && latest.prNumber.startsWith("PR-")) {
        const lastNum = parseInt(latest.prNumber.replace("PR-", ""), 10);
        if (!isNaN(lastNum)) {
          this.prNumber = `PR-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.prNumber = "PR-0001";
    } catch (error) {
      return next(error);
    }
  }
  next();
});

purchaseRequestSchema.index({ status: 1 });
purchaseRequestSchema.index({ department: 1 });
purchaseRequestSchema.index({ createdAt: -1 });

if (mongoose.models.PurchaseRequest) {
  delete mongoose.models.PurchaseRequest;
}

export default mongoose.models.PurchaseRequest ||
  mongoose.model("PurchaseRequest", purchaseRequestSchema);
