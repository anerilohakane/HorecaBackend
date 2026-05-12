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

    username: {
      type: String,
      sparse: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      trim: true
    },

    businessName: {
      type: String,
      trim: true,
      default: null
    },

    gstNumber: {
      type: String,
      trim: true,
      default: null
    },

    licenseImage: {
      type: String,
      trim: true,
      default: null
    },

    email: {
      type: String,
      sparse: true,
      unique: true,
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
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    isVerified: {
      type: Boolean,
      default: false
    },

    category: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      default: "D"
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
