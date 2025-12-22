import mongoose from 'mongoose';

const payrollConfigSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  paymentFrequency: {
    type: String,
    enum: ['Monthly', 'Bi-weekly', 'Weekly'],
    default: 'Monthly'
  },
  paymentDay: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  pfEnabled: {
    type: Boolean,
    default: true
  },
  pfWageLimit: {
    type: Number,
    default: 15000
  },
  esicEnabled: {
    type: Boolean,
    default: true
  },
  esicWageLimit: {
    type: Number,
    default: 21000
  },
  professionalTaxState: {
    type: String,
    default: 'Maharashtra'
  },
  workingDaysPerMonth: {
    type: Number,
    default: 26
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
  leaveEncashmentPolicy: {
    type: String,
    enum: ['Allowed', 'Not Allowed', 'Partial'],
    default: 'Allowed'
  },
  advanceLeaveAllowed: {
    type: Boolean,
    default: false
  },
  advanceLeaveMaxDays: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

export default mongoose.models.PayrollConfig || mongoose.model('PayrollConfig', payrollConfigSchema);