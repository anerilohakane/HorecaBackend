import mongoose from 'mongoose';

const DEFAULT_USER_ID = new mongoose.Types.ObjectId("66e2f79f3b8d2e1f1a9d9c33"); // Replace with your real ID

const earningSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Basic', 'HRA', 'TA', 'DA', 'Special Allowance', 'Bonus', 'Overtime', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['PF', 'TDS', 'Professional Tax', 'ESI', 'Loan', 'Advance', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const payslipSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  payslipId: {
    type: String,
    required: true,
    unique: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  earnings: [earningSchema],
  deductions: [deductionSchema],
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  workingDays: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  presentDays: {
    type: Number,
    required: true,
    min: 0
  },
  leaveDays: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Approved', 'Paid', 'Failed'],
    default: 'Draft'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque', 'N/A']
  },
  notes: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default: DEFAULT_USER_ID
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pfDetails: {
    employeeContribution: {
      type: Number,
      default: 0
    },
    employerContribution: {
      type: Number,
      default: 0
    },
    pensionContribution: {
      type: Number,
      default: 0
    },
    edliContribution: {
      type: Number,
      default: 0
    },
    adminCharges: {
      type: Number,
      default: 0
    },
    uanNumber: String
  },
  esicDetails: {
    employeeContribution: {
      type: Number,
      default: 0
    },
    employerContribution: {
      type: Number,
      default: 0
    },
    ipNumber: String
  },
  professionalTax: {
    type: Number,
    default: 0
  },
  leaveDetails: {
    paidLeaves: {
      type: Number,
      default: 0
    },
    unpaidLeaves: {
      type: Number,
      default: 0
    },
    leaveDeduction: {
      type: Number,
      default: 0
    }
  },
  lopDays: {
    type: Number,
    default: 0
  },
  isPFApplicable: {
    type: Boolean,
    default: false
  },
  isESICApplicable: {
    type: Boolean,
    default: false
  },
  isPTApplicable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure only one payslip per employee per month-year
// payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
// payslipSchema.index({ status: 1 });

delete mongoose.models.Payslip;
export default mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema);