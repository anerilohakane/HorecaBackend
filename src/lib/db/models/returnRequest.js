import mongoose from "mongoose";
const { Schema } = mongoose;

const ReturnItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    condition: { type: String }, // e.g., opened, unopened, damaged
    
    // Verification fields
    verifiedQuantity: { type: Number, default: 0 },
    damagedQuantity: { type: Number, default: 0 },
    shortQuantity: { type: Number, default: 0 },
    mismatchReason: { type: String },
    
    // Godown fields
    acceptedQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema(
  {
    rrn: { type: String, required: true, unique: true, index: true }, // Return Request Number
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Customer
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // Vendor
    
    items: { type: [ReturnItemSchema], required: true },
    
    comments: { type: String },
    images: { type: [String], default: [] },
    
    status: {
      type: String,
      enum: [
        "Pending Vendor Approval",
        "Vendor Approved",
        "Vendor Rejected",
        "Routed to SCM",
        "Awaiting Pickup Confirmation",
        "Escalated",
        "Pending SCM Assignment",
        "Route Planner Assigned",
        "Pickup Scheduled",
        "Pickup In Progress",
        "Pickup Delayed",
        "Pickup Completed",
        "Verification Completed",
        "Verification Discrepancy",
        "Awaiting Godown Confirmation",
        "Received at Godown",
        "Discrepancy Reported",
        "Stock Received",
        "Awaiting Credit Note Processing",
        "Credit Note Generated",
        "Return Closed"
      ],
      default: "Pending Vendor Approval",
    },
    
    // Logistics & Tracking
    pickupDate: { type: Date },
    routePlanner: { type: Schema.Types.ObjectId, ref: "User" },
    provisionalCreditNote: { type: String },
    finalCreditNote: { type: String },
    creditAmount: { type: Number },
    
    // SLA Tracking Dates
    vendorApprovalSlaDueDate: { type: Date },
    pickupSlaDueDate: { type: Date },
    
    // Timestamps
    requestedAt: { type: Date, default: Date.now },
    vendorActedAt: { type: Date },
    pickupConfirmedAt: { type: Date },
    scmAssignedAt: { type: Date },
    pickupCompletedAt: { type: Date },
    godownReceivedAt: { type: Date },
    closedAt: { type: Date },
    
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

ReturnRequestSchema.index({ order: 1 });
ReturnRequestSchema.index({ requester: 1 });
ReturnRequestSchema.index({ status: 1 });
ReturnRequestSchema.index({ supplier: 1 });

const ReturnRequest =
  mongoose.models.ReturnRequest ||
  mongoose.model("ReturnRequest", ReturnRequestSchema);

export default ReturnRequest;
