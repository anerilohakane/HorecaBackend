import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee", "superviser"],
      default: "employee",
    },
    department: String,
    position: String,
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sessionToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
delete mongoose.models.User;
// Check if the model already exists before creating it
export default mongoose.models.User || mongoose.model("User", userSchema);
