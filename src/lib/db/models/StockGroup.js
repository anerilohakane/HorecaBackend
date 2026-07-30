import mongoose from "mongoose";

const StockGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Stock group name is required"],
      trim: true,
      unique: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockGroup",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

const StockGroup = mongoose.models.StockGroup || mongoose.model("StockGroup", StockGroupSchema);
export default StockGroup;
