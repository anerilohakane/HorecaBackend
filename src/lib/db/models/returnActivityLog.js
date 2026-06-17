import mongoose from "mongoose";
const { Schema } = mongoose;

const ReturnActivityLogSchema = new Schema(
  {
    returnRequest: { type: Schema.Types.ObjectId, ref: "ReturnRequest", required: true, index: true },
    action: { type: String, required: true },
    oldStatus: { type: String },
    newStatus: { type: String },
    remarks: { type: String },
    performedBy: { type: Schema.Types.ObjectId }, // User, Vendor, or System
    userType: { type: String, enum: ["Customer", "Vendor", "CCT", "SCM", "RoutePlanner", "Godown", "ART", "Management", "System"] }
  },
  {
    timestamps: true,
  }
);

const ReturnActivityLog =
  mongoose.models.ReturnActivityLog ||
  mongoose.model("ReturnActivityLog", ReturnActivityLogSchema);

export default ReturnActivityLog;
