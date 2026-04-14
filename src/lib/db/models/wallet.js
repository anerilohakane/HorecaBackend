import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    unique: true
  },
  userType: {
    type: String,
    enum: ['supplier', 'customer', 'admin'],
    default: 'supplier'
  },
  balance: {
    type: Number,
    default: 0
  },
  realizedSavings: {
    type: Number,
    default: 0
  },
  escrowedPoints: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'closed'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
