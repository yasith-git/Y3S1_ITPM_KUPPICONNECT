const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../utils/upload');
const controller = require('./controller');

// ── Fully public (no auth) ──────────────────────────────────────────────
router.get('/summary/:classId', controller.getAISummary);  // load cached AI summary

router.use(protect);

// ── Existing content & reviews ────────────────────────────────────────
router.post('/upload', authorize('conductor'), upload.single('file'), controller.uploadContent);
router.put('/:id/ai-summary', authorize('conductor'), controller.updateAiSummary);
router.delete('/:id', authorize('conductor'), controller.deleteContent);

router.get('/class/:classId', controller.getContentForClass);
router.get('/:id', controller.getContentById);

router.post('/:id/reviews', authorize('student'), controller.addReview);
router.get('/:id/reviews', controller.getReviewsForContent);
router.delete('/:id/reviews/:reviewId', authorize('student'), controller.deleteReview);

// ── Comments (discussion board per class) ────────────────────────────
// Both conductors and enrolled students can post; image attachment optional
router.post(
  '/comments/:classId',
  upload.commentImageUpload.single('image'),
  controller.addComment
);
router.post(
  '/comments/:classId/:commentId/reply',
  upload.commentImageUpload.single('image'),
  controller.addReply
);
router.get('/comments/:classId', controller.getComments);
router.delete('/comments/:classId/:commentId', controller.deleteComment);

// ── Ratings ─────────────────────────────────────────────────────────────────
// NOTE: static sub-routes (mine, my-classes) MUST come before /:classId
router.get('/ratings/mine',       controller.getMyRatings);                                    // student's own submitted ratings
router.get('/ratings/my-classes', authorize('conductor'), controller.getClassesWithRatings);   // conductor's classes with aggregate
router.post('/ratings/:classId',  authorize('student'),   controller.addOrUpdateRating);
router.get('/ratings/:classId',                           controller.getRatings);

// ── Notes (PDF CRUD) ─────────────────────────────────────────────────
// Conductor uploads; enrolled students can list & download via static /uploads
router.post(
  '/notes/:classId',
  authorize('conductor'),
  upload.notesUpload.single('file'),
  controller.uploadNote
);
router.get('/notes/:classId', controller.getNotes);
router.put('/notes/:noteId', authorize('conductor'), controller.updateNote);
router.delete('/notes/:noteId', authorize('conductor'), controller.deleteNote);

// ── AI Summary ─────────────────────────────────────────────────
// GET is public (registered above protect). POST requires auth to prevent abuse.
router.post('/summary/:classId', controller.saveAISummary);

module.exports = router;

