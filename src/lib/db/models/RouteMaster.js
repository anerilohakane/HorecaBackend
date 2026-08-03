import mongoose from "mongoose";

const routeMasterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true },
    vehicle: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    originCity: { type: String, default: null, trim: true },
    destinationCity: { type: String, default: null, trim: true },
    coveragePincodes: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

if (mongoose.models.RouteMaster) {
  delete mongoose.models.RouteMaster;
}

export default mongoose.models.RouteMaster || mongoose.model("RouteMaster", routeMasterSchema);
