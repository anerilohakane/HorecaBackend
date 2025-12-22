import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: false
  },
  checkOut: Date,
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-day', 'Leave', 'Holiday', 'Weekend'],
    default: 'Present'
  },
  isProxy: {
    type: Boolean,
    default: false
  },
  proxyDetails: {
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  notes: String,
  location: {
    type: String,
    coordinates: [Number] // [longitude, latitude]
  },
  ipAddress: String,
  deviceId: String
}, {
  timestamps: true
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);