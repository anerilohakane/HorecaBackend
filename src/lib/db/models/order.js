// /models/Order.js
/**
 * Single-file place for all order-related schemas & models:
 * - Order (with embedded invoice, payment, delivery, b2b, items)
 * - ReturnRequest (for return/refund/replacement workflows)
 *
 * Usage:
 *   import Order from "@/models/Order"; // default export Order
 *   import { ReturnRequest } from "@/models/Order";
 *
 * Note: replace product/supplier/user refs with your actual model names if different.
 */

import mongoose from "mongoose";
const { Schema } = mongoose;

/* ---------- Enums / constants ---------- */
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
  "replacement_sent",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const DELIVERY_STATUSES = [
  "pending",
  "out_for_delivery",
  "delivered",
  "failed",
  "cancelled",
];

/* ---------- Sub-schemas ---------- */

/* Order item: snapshot of product at time of ordering */
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // helpful for multi-supplier scenarios
    attributes: { type: Schema.Types.Mixed }, // e.g., color/size selected
  },
  { _id: false }
);

/* Invoice metadata */
const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String },
    generatedAt: { type: Date },
    url: { type: String }, // if you upload invoice PDF and store link
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/* Payment info */
const PaymentSchema = new Schema(
  {
    method: { type: String }, // e.g. bank_transfer, card, cod
    status: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    transactionId: { type: String },
    paidAt: { type: Date },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/* Delivery assignment/status */
const DeliverySchema = new Schema(
  {
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" }, // delivery personnel user id
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" }, // who assigned (admin/supplier)
    assignedAt: { type: Date },
    status: { type: String, enum: DELIVERY_STATUSES, default: "pending" },
    trackingNumber: { type: String },
    eta: { type: Date },
    lastLocation: { type: Schema.Types.Mixed }, // optional geo or location snapshot
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/* B2B specific fields */
const B2BSchema = new Schema(
  {
    companyName: { type: String },
    purchaseOrderNumber: { type: String },
    gstNumber: { type: String },
    billingAddress: { type: String },
    shippingAddress: { type: String },
    contactPerson: { type: String },
    contactPhone: { type: String },
    billingEmail: { type: String },
  },
  { _id: false }
);

/* ---------- Main Order schema ---------- */
const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // generate before saving
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who placed order
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // primary supplier (optional)
    items: { type: [OrderItemSchema], required: true },

    // shippingAddress: {
    //   fullName: { type: String },
    //   addressLine1: { type: String },
    //   addressLine2: { type: String },
    //   city: { type: String },
    //   state: { type: String },
    //   pincode: { type: String },
    //   phone: { type: String },
    //   email: { type: String },
    // },
    shippingAddress: {
    fullName: String,
    email: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },

    // amounts
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    total: { type: Number, required: true },

    currency: { type: String, default: "INR" },

    // lifecycle
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    placedAt: { type: Date, default: Date.now },

    // embedded sub-docs
    invoice: { type: InvoiceSchema },
    payment: { type: PaymentSchema },
    delivery: { type: DeliverySchema },
    b2b: { type: B2BSchema },

    // misc
    notes: { type: String },
    cancellationReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

/* Indexes */
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ supplier: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

/* ---------- Helpful pre-save hooks (optional) ---------- */

/**
 * Example: if you want to auto-generate orderNumber when saving if missing.
 * You can replace this with your own generator logic.
 */
OrderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    // simple generator: ORD-<timestamp>-<shortrandom>
    const short = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${short}`;
  }
  next();
});

/* ---------- Exports ---------- */
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// Re-export ReturnRequest from its own file for backward compatibility
import ReturnRequest from "./returnRequest";

export default Order;
export { ReturnRequest };
