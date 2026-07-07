import mongoose from "mongoose";

const customerProductMappingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.CustomerProductMapping || mongoose.model("CustomerProductMapping", customerProductMappingSchema);
