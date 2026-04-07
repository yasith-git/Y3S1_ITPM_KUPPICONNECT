const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { announcementUpload } = require('../../utils/upload');
const controller = require('./controller');

/* ── Public routes (no auth required) ────────────────────────────── */

// Landing page: fetch all active announcements for the carousel
router.get('/landing/active', controller.getActiveLandingAnnouncements);

// ── Class-based announcements (public) ────────────────────────────
// Home page: upcoming classes (dateTime in the future), newest first
router.get('/classes/upcoming', controller.getUpcomingClassAnnouncements);
// Past Classes page: classes whose dateTime has passed
router.get('/classes/past',     controller.getPastClassAnnouncements);

/* ── All routes below require a valid JWT ─────────────────────────── */
router.use(protect);

// ── Class-based announcements (existing) ──────────────────────────
router.post('/', authorize('conductor'), controller.createAnnouncement);
router.get('/my', authorize('conductor'), controller.getMyConductorAnnouncements);
router.put('/:id', authorize('conductor'), controller.updateAnnouncement);
router.delete('/:id', authorize('conductor'), controller.deleteAnnouncement);

// Both roles: view announcements for a class
router.get('/class/:classId', controller.getAnnouncementsForClass);

// ── Landing page announcements (conductor management) ─────────────
router.post(
  '/landing',
  authorize('conductor'),
  announcementUpload.single('image'),
  controller.createLandingAnnouncement
);

// All of this conductor's landing announcements (all statuses)
router.get('/landing/all', authorize('conductor'), controller.getMyConductorLandingAnnouncements);

// Upcoming (startDate in the future)
router.get('/landing/upcoming', authorize('conductor'), controller.getUpcomingLandingAnnouncements);

// Expired (endDate in the past)
router.get('/landing/expired', authorize('conductor'), controller.getExpiredLandingAnnouncements);

// Update a landing announcement (image optional)
router.put(
  '/landing/:id',
  authorize('conductor'),
  announcementUpload.single('image'),
  controller.updateLandingAnnouncement
);

// Delete a landing announcement
router.delete('/landing/:id', authorize('conductor'), controller.deleteLandingAnnouncement);

// ── Student: own completed classes ────────────────────────────────
router.get('/classes/my-past', authorize('student'), controller.getStudentPastClasses);

module.exports = router;
