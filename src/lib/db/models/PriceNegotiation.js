import mongoose from "mongoose";
const { Schema } = mongoose;

const RemarkSchema = new Schema(
  {
    senderType: {
      type: String,
      enum: ["Customer", "Sales"],
      required: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel"
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Customer", "User"] // User refers to the Sales Representative in the User model
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: true, timestamps: true }
);

const PriceNegotiationSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    originalPrice: {
      type: Number,
      required: true
    },
    requestedPrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed", "expired"],
      default: "pending",
      index: true
    },
    remarks: {
      type: [RemarkSchema],
      default: []
    },
    salesRepresentative: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    proofImageUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "price_negotiations"
  }
);

export default mongoose.models.PriceNegotiation || mongoose.model("PriceNegotiation", PriceNegotiationSchema);
