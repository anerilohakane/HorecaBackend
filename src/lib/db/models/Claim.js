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
    actualPrice: {
      type: Number
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
      enum: ["REQUESTED", "APPROVED", "REJECTED", "PENDING", "RAISED", "SETTLED", "PARTIALLY_APPROVED"], // Keeping old ones for compatibility
      default: "REQUESTED"
    },
    quantity: {
      type: Number,
      default: 1
    },
    claimAmount: {
      type: Number,
      default: 0
    },
    vendorResponseStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    rejectionReason: {
      type: String
    },
    actionLog: [
      {
        action: {
          type: String,
          required: true
        },
        note: String,
        performedBy: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
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
    salesRepresentativeName: {
      type: String // Explicitly store the selected sales representative's name
    },
    salesRepresentativeEmail: {
      type: String // To easily map and filter claims for the logged-in sales user
    },
    approvalDate: {
      type: Date
    }
  },
  { timestamps: true }
);

const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);
export default Claim;
