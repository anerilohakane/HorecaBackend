import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      default: null,
      trim: true
    },

    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },

    address: {
      type: String,
      default: null,
      trim: true
    },

    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
