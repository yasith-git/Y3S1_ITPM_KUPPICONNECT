const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    studentDetails: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      guardianName: { type: String, trim: true },
      guardianPhone: { type: String, trim: true },
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // Tracks whether the 2-day reminder email has been sent
    reminder2DaySent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
