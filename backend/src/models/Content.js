const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'image', 'other'],
      default: 'other',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    aiSummary: {
      type: String,
      default: '',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
