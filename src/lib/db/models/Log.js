import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error'],
    required: true,
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    // examples: ORDER_CREATED, PAYMENT_FAILED, USER_LOGIN, etc.
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel', // Can be User or Customer/Employee
    default: null
  },
  userModel: {
    type: String,
    enum: ['User', 'Customer', 'Employee'], // Adjust based on your models
    default: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // this adds createdAt and updatedAt
  autoIndex: true
});

// 🔥 INDEXING FOR HIGH PERFORMANCE & VOLUME MANAGEMENT
// 1) Fast lookup by user (timeline)
LogSchema.index({ userId: 1, createdAt: -1 });

// 2) Fast lookup by action type
LogSchema.index({ action: 1, createdAt: -1 });

// 3) 🔥 DATA PURGE (TTL Index) - Automatically remove logs older than 90 days
// to keep database size under control as requested by user.
// 90 days = 60 * 60 * 24 * 90 = 7,776,000 seconds
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

export default Log;
