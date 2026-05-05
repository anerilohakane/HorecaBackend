import mongoose from "mongoose";

const { Schema } = mongoose;

const claimSchema = new Schema(
  {
    claimId: {
      type: String,
      unique: true,
      required: true
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    claimTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "ClaimTemplate"
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order"
    },
    claimType: {
      type: String,
      enum: ["PLUS_MINUS", "PRIMARY", "SECONDARY", "REVERSE"],
      required: true
    },
    requestedPrice: {
      type: Number,
      required: true
    },
    actualSellingPrice: {
      type: Number,
      required: true
    },
    expectedSellingPrice: {
      type: Number,
      required: true
    },
    lossAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "RAISED", "SETTLED"],
      default: "REQUESTED"
    },
    fileUrl: {
      type: String
    },
    proofUrl: {
      type: String
    },
    approvalToken: {
      type: String
    },
    approvedBy: {
      type: String // Name/Email of the sales person who approved
    },
    approvalDate: {
      type: Date
    }
  },
  { timestamps: true }
);

const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);
export default Claim;
