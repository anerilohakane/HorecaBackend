import mongoose from "mongoose";
const { Schema } = mongoose;

const ReturnItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    
    // Partial Return Fields
    orderedQuantity: { type: Number },
    deliveredQuantity: { type: Number },
    previouslyReturnedQuantity: { type: Number, default: 0 },
    
    requestedReturnQty: { type: Number, required: true, min: 1 },
    approvedQuantity: { type: Number, default: 0 },
    pickedQuantity: { type: Number, default: 0 },
    
    // Item Level Workflow
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    rejectionReason: { type: String },

    reason: { type: String, required: true },
    condition: { type: String }, // e.g., opened, unopened, damaged
    
    // Verification fields
    verifiedQuantity: { type: Number, default: 0 },
    damagedQuantity: { type: Number, default: 0 },
    shortQuantity: { type: Number, default: 0 },
    mismatchReason: { type: String },
    
    // Godown fields
    receivedQuantity: { type: Number, default: 0 },
    acceptedQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    
    godownChecklist: {
      qtyMatch: { type: Boolean, default: false },
      actualReceivedQty: { type: Number },
      packagingIntact: { type: Boolean, default: false },
      expiryValid: { type: Boolean, default: false },
      skuMatch: { type: Boolean, default: false },
      temperatureOK: { type: Boolean, default: false }
    },

    // Customer Verification fields
    images: { type: [String], default: [] },
    expiryDate: { type: Date },
    deliveryDate: { type: Date },
    batchDetails: { type: String },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema(
  {
    rrn: { type: String, required: true, unique: true, index: true }, // Return Request Number
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "Customer", required: true }, // Customer
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // Vendor
    
    items: { type: [ReturnItemSchema], required: true },
    
    comments: { type: String },
    images: { type: [String], default: [] },
    
    status: {
      type: String,
      enum: [
        "Pending Vendor Approval",
        "Partially Approved",
        "Vendor Approved",
        "Pending Logistics Approval",
        "Logistics Approved",
        "Vendor Rejected",
        "Logistics Rejected",
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
    
    routePlannerDetails: {
      driverName: { type: String },
      driverPhone: { type: String },
      vehicleNumber: { type: String },
    },
    
    // Godown Inspection
    godownCondition: {
      type: String,
      enum: ["Pending", "Good", "Damaged"],
      default: "Pending"
    },
    cnGenerationAllowed: { type: Boolean, default: false },
    godownRemarks: { type: String },
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
