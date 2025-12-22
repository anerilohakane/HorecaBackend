import mongoose from 'mongoose';

const leaveApplicationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Bereavement', 'Compensatory', 'Other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  contactNumber: String,
  addressDuringLeave: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAdvanceLeave: {
    type: Boolean,
    default: false
  },
  advanceLeaveDeductionPlan: {
    deductionStartMonth: Date,
    numberOfMonths: Number,
    monthlyDeductionAmount: Number
  }
}, {
  timestamps: true
});

leaveApplicationSchema.index({ employee: 1, startDate: 1 });
leaveApplicationSchema.index({ status: 1 });

export default mongoose.models.LeaveApplication || mongoose.model('LeaveApplication', leaveApplicationSchema);