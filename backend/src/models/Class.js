const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Class title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Class description is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Class date and time is required'],
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    classType: {
      type: String,
      enum: ['online', 'physical'],
      default: 'online',
    },
    duration: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      default: 50,
      min: [1, 'Capacity must be at least 1'],
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    monthlyFee: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // AI-generated comment sentiment summary (cached on demand, conductor can regenerate)
    aiSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    aiSummaryAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
