import mongoose from 'mongoose';

const approvalStepSchema = new mongoose.Schema({
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Skipped'],
    default: 'Pending'
  },
  comments: String,
  approvedAt: Date,
  dueDate: Date
});

const approvalWorkflowSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Attendance', 'Leave', 'Payroll', 'Expense', 'Compliance'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  currentStep: {
    type: Number,
    default: 0
  },
  steps: [approvalStepSchema],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  }
}, {
  timestamps: true
});

approvalWorkflowSchema.index({ type: 1, referenceId: 1 });
approvalWorkflowSchema.index({ status: 1 });
approvalWorkflowSchema.index({ initiatedBy: 1 });

export default mongoose.models.ApprovalWorkflow || mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);