import mongoose from 'mongoose';
const DEFAULT_USER_ID = new mongoose.Types.ObjectId("66e2f79f3b8d2e1f1a9d9c33"); // Replace with your real

const complianceItemSchema = new mongoose.Schema({
  regulation: {
    type: String,
    required: true
  },
  requirement: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Compliant', 'Non-Compliant', 'In Progress', 'Not Applicable'],
    default: 'In Progress'
  },
  dueDate: Date,
  completedDate: Date,
  notes: String
});

const complianceReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Quarterly', 'Annual', 'Ad-hoc']
  },
  period: {
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date,
      required: true
    }
  },
  complianceItems: [complianceItemSchema],
  overallStatus: {
    type: String,
    enum: ['Compliant', 'Non-Compliant', 'Partially Compliant'],
    default: 'Partially Compliant'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    default: DEFAULT_USER_ID
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  notes: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

complianceReportSchema.index({ reportId: 1 });
complianceReportSchema.index({ reportType: 1 });
complianceReportSchema.index({ 'period.from': 1, 'period.to': 1 });
delete mongoose.models.ComplianceReport
export default mongoose.models.ComplianceReport || mongoose.model('ComplianceReport', complianceReportSchema);