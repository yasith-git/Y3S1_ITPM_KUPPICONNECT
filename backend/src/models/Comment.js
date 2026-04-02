const mongoose = require('mongoose');

/**
 * Embedded sub-document for a reply to a top-level comment.
 * Replies are stored inside the parent comment document (no separate collection).
 * The UI limits nesting to depth 2 so a flat replies[] array is sufficient.
 */
const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String, // relative URL: /uploads/comment-images/<filename>
      default: '',
    },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String, // relative URL: /uploads/comment-images/<filename>
      default: '',
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

// Fast lookup of all comments for a class, newest first
commentSchema.index({ class: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
