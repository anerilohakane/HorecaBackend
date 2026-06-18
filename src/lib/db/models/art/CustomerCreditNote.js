import mongoose from "mongoose";

const customerCreditNoteSchema = new mongoose.Schema(
  {
    cnNumber: { type: String, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    assignedArtMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    communicationStatus: {
      type: String,
      enum: ["Pending", "Sent"],
      default: "Pending",
    },
    sentVia: {
      type: String, // 'Email', 'WhatsApp'
    },
    sentAt: { type: Date },
    notes: { type: String, default: "" },
    items: [
      {
        description: String,
        hsnSac: String,
        quantity: Number,
        rate: Number,
        amount: Number,
        cgstPercent: Number,
        sgstPercent: Number,
      }
    ],
  },
  { timestamps: true }
);

// Auto-generate CN number
customerCreditNoteSchema.pre("save", async function (next) {
  if (!this.cnNumber) {
    try {
      const latest = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      if (latest && latest.cnNumber && latest.cnNumber.startsWith("CCN-")) {
        const lastNum = parseInt(latest.cnNumber.replace("CCN-", ""), 10);
        if (!isNaN(lastNum)) {
          this.cnNumber = `CCN-${String(lastNum + 1).padStart(4, "0")}`;
          return next();
        }
      }
      this.cnNumber = "CCN-0001";
    } catch (error) {
      return next(error);
    }
  }
  next();
});

customerCreditNoteSchema.index({ communicationStatus: 1 });
customerCreditNoteSchema.index({ assignedArtMember: 1 });

if (mongoose.models.CustomerCreditNote) {
  delete mongoose.models.CustomerCreditNote;
}

export default mongoose.models.CustomerCreditNote ||
  mongoose.model("CustomerCreditNote", customerCreditNoteSchema);
