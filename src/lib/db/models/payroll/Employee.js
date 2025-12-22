//scm/src/lib/db/models/payroll/Employee.js

import mongoose from "mongoose";
const DEFAULT_USER_ID = new mongoose.Types.ObjectId("66e2f79f3b8d2e1f1a9d9c33"); // Replace with your real
const allowanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["HRA", "TA", "DA", "Medical", "Special"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["PF", "TDS", "ProfessionalTax", "ESI", "Other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const bankAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  ifscCode: {
    type: String,
    required: true,
  },
  branch: String,
});

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    personalDetails: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
      dateOfJoining: {
        type: Date,
        required: true,
      },
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
      },
    },
    jobDetails: {
      department: {
        type: String,
        required: true,
      },
      designation: {
        type: String,
        required: true,
      },
      employmentType: {
        type: String,
        enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
        default: "Full-Time",
      },
      reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      workLocation: String,
    },
    salaryDetails: {
      basicSalary: {
        type: Number,
        required: true,
      },
      allowances: [allowanceSchema],
      deductions: [deductionSchema],
      bankAccount: bankAccountSchema,
      panNumber: String,
      aadharNumber: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended", "Terminated"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: DEFAULT_USER_ID,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: DEFAULT_USER_ID,
    },
    sessionToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
delete mongoose.models.Employee;
export default mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

//sample