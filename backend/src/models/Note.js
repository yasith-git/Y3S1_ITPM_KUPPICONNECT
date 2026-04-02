const mongoose = require('mongoose');

/**
 * A PDF note uploaded by a conductor for a specific class.
 * Only approved-enrolled students of that class can download it.
 * Full CRUD is supported: create, list, rename/retitle (update), delete.
 */
const noteSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    fileUrl: {
      type: String, // relative URL: /uploads/notes/<filename>
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

noteSchema.index({ class: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
