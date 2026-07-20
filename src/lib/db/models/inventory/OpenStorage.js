import mongoose from "mongoose";

const openStorageSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true }, // This maps to receivedQty from GRN
    unit: { type: String, default: "pcs" },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, default: 0 },
    
    // Metadata from PO/GRN
    supplier: {
      id: { type: String },
      name: { type: String },
    },
    poNumber: { type: String },
    grnNumber: { type: String },
    grnId: { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceivedNote" },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    
    // Template info
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "POTemplate" },
    headers: { type: mongoose.Schema.Types.Mixed },
    
    // Status in storage
    status: {
      type: String,
      enum: ["Available", "Allocated", "Consumed", "Returned"],
      default: "Available",
    },
    
    receivedDate: { type: Date, default: Date.now },
  },
  { 
    timestamps: true,
    strict: false // To allow extra fields from the PO template
  }
);

// Indexes for faster lookups
openStorageSchema.index({ productId: 1 });
openStorageSchema.index({ sku: 1 });
openStorageSchema.index({ grnNumber: 1 });
openStorageSchema.index({ poNumber: 1 });
openStorageSchema.index({ status: 1 });

export default mongoose.models.OpenStorage || mongoose.model("OpenStorage", openStorageSchema);
