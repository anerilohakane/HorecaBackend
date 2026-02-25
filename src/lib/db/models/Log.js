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
  timestamps: true // this adds createdAt and updatedAt
});

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

export default Log;
