const mongoose = require('mongoose');

/**
 * One rating record per student per class (enforced by unique compound index).
 * Upsert on the (class, student) pair handles "change your rating" gracefully.
 * The conductor's aggregate ratingAvg / ratingCount on the User document
 * is always recalculated from all Rating documents after every write.
 */
const ratingSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating value is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must not exceed 5'],
    },
  },
  { timestamps: true }
);

// Prevent duplicate rating — one student, one class
ratingSchema.index({ class: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
