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
    
    locations: [{
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      isPrimary: { type: Boolean, default: false }
    }],
    
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null
    },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    isVerified: {
      type: Boolean,
      default: false
    },

    category: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
      default: "C"
    },

    poMandatory: {
      type: Boolean,
      default: false
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "customers"
  }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
