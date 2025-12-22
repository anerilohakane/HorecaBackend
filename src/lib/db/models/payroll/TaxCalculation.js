import mongoose from 'mongoose';

// Create a default user ID for development
const DEFAULT_USER_ID = new mongoose.Types.ObjectId("66e2f79f3b8d2e1f1a9d9c33");

const taxDetailSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['TDS', 'Professional Tax', 'Income Tax', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  calculationMethod: String,
  applicableFrom: Date,
  applicableTo: Date
});

const taxCalculationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  financialYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // Format: YYYY-YY
  },
  totalEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  taxableIncome: {
    type: Number,
    required: true,
    min: 0
  },
  taxDetails: [taxDetailSchema],
  totalTax: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Calculated', 'Reviewed', 'Approved', 'Filed'],
    default: 'Calculated'
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default: DEFAULT_USER_ID
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

taxCalculationSchema.index({ employee: 1, financialYear: 1 }, { unique: true });
taxCalculationSchema.index({ financialYear: 1 });
taxCalculationSchema.index({ status: 1 });
delete mongoose.models.TaxCalculation
// Check if the model already exists before creating it
export default mongoose.models.TaxCalculation || mongoose.model('TaxCalculation', taxCalculationSchema);