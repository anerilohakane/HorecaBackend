// lib/db/models/Task.js
import mongoose from "mongoose";

const progressCommentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
  progress: { type: Number, required: true, min: 0, max: 100 },
  date: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const subTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedByModel",
      required: true,
    },
    assignedByModel: {
      type: String,
      enum: ["User", "Employee"],
      required: true,
      default: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Blocked", "Deferred"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    dueDate: { type: Date, required: true },
    startDate: { type: Date, default: Date.now },
    completedAt: Date,
    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0 },
    progress: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 100;
        },
        message: 'Progress must be between 0 and 100'
      }
    },
    progressComments: [progressCommentSchema],
    tags: [String],
    category: {
      type: String,
      enum: [
        "Development",
        "Design",
        "Testing",
        "Documentation",
        "Meeting",
        "Support",
        "Other",
      ],
      default: "Other",
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    subTasks: [subTaskSchema],
    comments: [commentSchema],
    attachments: [
      {
        filename: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly", "Yearly"],
    },
    nextRecurrenceDate: Date,
  },
  { timestamps: true }
);

// Virtual for progress status
taskSchema.virtual('progressStatus').get(function() {
  if (this.progress === 0) return 'Not Started';
  if (this.progress < 25) return 'Getting Started';
  if (this.progress < 50) return 'In Progress';
  if (this.progress < 75) return 'Halfway There';
  if (this.progress < 100) return 'Almost Done';
  return 'Completed';
});

// Indexes
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ progress: 1 });
taskSchema.index({ "progressComments.date": 1 });

// Middleware to update status based on progress
taskSchema.pre('save', function(next) {
  if (this.progress === 100 && this.status !== 'Completed') {
    this.status = 'Completed';
    this.completedAt = new Date();
  } else if (this.progress > 0 && this.progress < 100 && this.status === 'Pending') {
    this.status = 'In Progress';
  } else if (this.progress === 0 && this.status === 'In Progress') {
    this.status = 'Pending';
  }
  next();
});

if (mongoose.models.Task) {
  delete mongoose.models.Task;
}

export default mongoose.model("Task", taskSchema);