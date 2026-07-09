import mongoose from "mongoose";

const { Schema } = mongoose;

const VendorOrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const VendorOrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // The PO number from SCM
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The buyer (SCM User)
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true }, // The vendor
    items: { type: [VendorOrderItemSchema], required: true },
    
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: { 
      type: String, 
      enum: ["pending", "processing", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"], 
      default: "pending" 
    },
    payment: {
      method: { type: String, default: "cod" },
      status: { type: String, default: "pending" }
    },
    
    invoice: { type: Schema.Types.Mixed }, // Invoice reference if needed
    expectedDeliveryDate: { type: Date },
    
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
  }
);

VendorOrderSchema.index({ user: 1 });
VendorOrderSchema.index({ supplier: 1 });
VendorOrderSchema.index({ status: 1 });
VendorOrderSchema.index({ createdAt: -1 });

if (mongoose.models.VendorOrder) {
  delete mongoose.models.VendorOrder;
}

const VendorOrder = mongoose.models.VendorOrder || mongoose.model("VendorOrder", VendorOrderSchema);

export default VendorOrder;
