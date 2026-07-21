import mongoose from "mongoose";

const productRequestSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryName: { type: String },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    cctRemarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.ProductRequest ||
  mongoose.model("ProductRequest", productRequestSchema);
