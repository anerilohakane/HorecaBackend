import mongoose from "mongoose";

const { Schema } = mongoose;

const branchSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, "Branch code is required"],
      trim: true,
      unique: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

delete mongoose.models.Branch;
const Branch = mongoose.models.Branch || mongoose.model("Branch", branchSchema);

export default Branch;
