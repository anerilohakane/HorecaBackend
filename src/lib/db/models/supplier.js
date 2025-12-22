// /models/Supplier.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const { Schema } = mongoose;

const supplierSchema = new Schema(
  {
    businessName: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"]
    },
    phone: { type: String },
    role: { type: String, default: "supplier" },

    businessType: {
      type: String,
      enum: ["farmer", "wholesaler", "retailer", "processor", "other", "Agriculture"]
    },
    shopName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },

    bankDetails: {
      accountHolderName: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
    },

    documents: { type: Array, default: [] },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "inactive", "blocked"],
      default: "pending"
    },
    verificationNotes: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    phoneVerificationToken: { type: String },
    phoneVerificationExpires: { type: Date },
    isPhoneVerified: { type: Boolean, default: false },

    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
supplierSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
supplierSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate access token
supplierSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET || "fallback_access_token_secret",
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );
};

// Generate refresh token
supplierSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_token_secret",
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

// Password reset token helper
supplierSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
export default Supplier;
