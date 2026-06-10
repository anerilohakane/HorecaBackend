import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "settings"
  }
);

// We will use "priceNegotiationEligibleTiers" as the key for our specific setting
export default mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
