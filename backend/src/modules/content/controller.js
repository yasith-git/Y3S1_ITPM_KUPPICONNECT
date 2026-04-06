const contentService = require('./service');
const { sendSuccess } = require('../../utils/responseHandler');

const uploadContent = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const content = await contentService.uploadContent(req.user._id, req.body, req.file);
    sendSuccess(res, content, 'Content uploaded', 201);
  } catch (error) {
    next(error);
  }
};

const getContentForClass = async (req, res, next) => {
  try {
    const content = await contentService.getContentForClass(
      req.params.classId,
      req.user._id,
      req.user.role
    );
    sendSuccess(res, content, 'Content fetched');
  } catch (error) {
    next(error);
  }
};

const getContentById = async (req, res, next) => {
  try {
    const content = await contentService.getContentById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    sendSuccess(res, content, 'Content fetched');
  } catch (error) {
    next(error);
  }
};

const updateAiSummary = async (req, res, next) => {
  try {
    const { aiSummary } = req.body;
    const content = await contentService.updateAiSummary(req.params.id, req.user._id, aiSummary);
    sendSuccess(res, content, 'AI summary updated');
  } catch (error) {
    next(error);
  }
};

const deleteContent = async (req, res, next) => {
  try {
    await contentService.deleteContent(req.params.id, req.user._id);
    sendSuccess(res, null, 'Content deleted');
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await contentService.addReview(req.params.id, req.user._id, { rating, comment });
    sendSuccess(res, review, 'Review added', 201);
  } catch (error) {
    next(error);
  }
};

const getReviewsForContent = async (req, res, next) => {
  try {
    const reviews = await contentService.getReviewsForContent(req.params.id);
    sendSuccess(res, reviews, 'Reviews fetched');
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await contentService.deleteReview(req.params.reviewId, req.user._id);
    sendSuccess(res, null, 'Review deleted');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   COMMENTS — class discussion with conductor replies
   ════════════════════════════════════════════════════════════════════ */

const addComment = async (req, res, next) => {
  try {
    // req.file is optional (attached image)
    const imageUrl = req.file ? `/uploads/comment-images/${req.file.filename}` : '';
    const comment = await contentService.addComment(
      req.params.classId,
      req.user._id,
      req.user.role,
      { text: req.body.text, imageUrl }
    );
    sendSuccess(res, comment, 'Comment added', 201);
  } catch (error) {
    next(error);
  }
};

const addReply = async (req, res, next) => {
  try {
    const imageUrl = req.file ? `/uploads/comment-images/${req.file.filename}` : '';
    const comment = await contentService.addReply(
      req.params.classId,
      req.params.commentId,
      req.user._id,
      req.user.role,
      { text: req.body.text, imageUrl }
    );
    sendSuccess(res, comment, 'Reply added', 201);
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const comments = await contentService.getComments(
      req.params.classId,
      req.user._id,
      req.user.role
    );
    sendSuccess(res, comments, 'Comments fetched');
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await contentService.deleteComment(req.params.commentId, req.user._id, req.user.role);
    sendSuccess(res, null, 'Comment deleted');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   RATINGS — 1-5 per student per class; conductor profile updated
   ════════════════════════════════════════════════════════════════════ */

const addOrUpdateRating = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }
    const result = await contentService.addOrUpdateRating(
      req.params.classId,
      req.user._id,
      rating
    );
    sendSuccess(res, result, 'Rating saved');
  } catch (error) {
    next(error);
  }
};

const getRatings = async (req, res, next) => {
  try {
    // Pass studentId only for students so myRating is populated
    const studentId = req.user.role === 'student' ? req.user._id : null;
    const result = await contentService.getRatings(req.params.classId, studentId);
    sendSuccess(res, result, 'Ratings fetched');
  } catch (error) {
    next(error);
  }
};

const getMyRatings = async (req, res, next) => {
  try {
    const ratings = await contentService.getMyRatings(req.user._id);
    sendSuccess(res, ratings, 'My ratings fetched');
  } catch (error) {
    next(error);
  }
};

const getClassesWithRatings = async (req, res, next) => {
  try {
    const result = await contentService.getClassesWithRatings(req.user._id);
    sendSuccess(res, result, 'Class ratings fetched');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   NOTES — PDF CRUD; conductor uploads, enrolled students download
   ════════════════════════════════════════════════════════════════════ */

const uploadNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }
    const note = await contentService.uploadNote(
      req.params.classId,
      req.user._id,
      { title: req.body.title, description: req.body.description },
      req.file
    );
    sendSuccess(res, note, 'Note uploaded', 201);
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const notes = await contentService.getNotes(
      req.params.classId,
      req.user._id,
      req.user.role
    );
    sendSuccess(res, notes, 'Notes fetched');
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await contentService.updateNote(
      req.params.noteId,
      req.user._id,
      { title: req.body.title, description: req.body.description }
    );
    sendSuccess(res, note, 'Note updated');
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    await contentService.deleteNote(req.params.noteId, req.user._id);
    sendSuccess(res, null, 'Note deleted');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   AI SUMMARY — server-side keyword/sentiment analysis of comments
   ════════════════════════════════════════════════════════════════════ */

const getAISummary = async (req, res, next) => {
  try {
    const summary = await contentService.getAISummary(req.params.classId);
    sendSuccess(res, summary, 'AI summary fetched');
  } catch (error) {
    next(error);
  }
};

const saveAISummary = async (req, res, next) => {
  try {
    const summary = await contentService.saveAISummary(req.params.classId);
    sendSuccess(res, summary, 'AI summary generated and saved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Existing
  uploadContent,
  getContentForClass,
  getContentById,
  updateAiSummary,
  deleteContent,
  addReview,
  getReviewsForContent,
  deleteReview,
  // Comments
  addComment,
  addReply,
  getComments,
  deleteComment,
  // Ratings
  addOrUpdateRating,
  getRatings,
  getMyRatings,
  getClassesWithRatings,
  // Notes
  uploadNote,
  getNotes,
  updateNote,
  deleteNote,
  // AI Summary
  getAISummary,
  saveAISummary,
};
