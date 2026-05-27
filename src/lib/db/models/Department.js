import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    departmentName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    permissions: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "departments", // Match the existing collection name
  }
);

// Clear the model if it already exists to avoid issues in development
delete mongoose.models.Department;

const Department = mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
export default Department;
