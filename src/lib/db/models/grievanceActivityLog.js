import mongoose from "mongoose";

const grievanceActivityLogSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        "Created",
        "Assigned",
        "Status Changed",
        "Priority Changed",
        "Note Added",
        "Escalated",
      ],
      required: true,
    },
    oldValue: {
      type: String,
      default: "",
    },
    newValue: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      // Can be User (agent) or Customer
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.GrievanceActivityLog ||
  mongoose.model("GrievanceActivityLog", grievanceActivityLogSchema);
