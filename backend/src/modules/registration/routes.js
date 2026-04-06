/**
 * registration/routes.js — Member 3 (Registration feature)
 *
 * All routes owned by Member 3:
 *  A. Student enrollment routes
 *  B. Student class-request routes
 *
 * Conductor-side class-request management (view, approve/dismiss)
 * is in conductor/routes.js.
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const controller = require('./controller');

router.use(protect);

/* ── A. Enrollment routes (student) ─────────────────────────────── */
router.post('/enroll',              authorize('student'), controller.enrollInClass);
router.get('/my-classes',           authorize('student'), controller.getMyClasses);
router.get('/my-enrollments',       authorize('student'), controller.getMyEnrollments);
router.get('/my-enrollments/:id',   authorize('student'), controller.getEnrollmentById);
router.delete('/my-enrollments/:id',authorize('student'), controller.cancelEnrollment);

/* ── Enrollment routes (conductor) ──────────────────────────────── */
router.post('/send-confirmation/:id',   authorize('conductor'), controller.sendConfirmationEmail);
router.get('/export/:classId',          authorize('conductor'), controller.exportToExcel);
router.post('/test-email',              controller.testEmail);   // any authenticated user

/* ── B. Student class-request routes ────────────────────────────── */
// Student submits a topic request to a conductor
router.post('/requests',             authorize('student'), controller.createRequest);
// Student views all their own requests
router.get('/requests',              authorize('student'), controller.getMyRequests);
// Student deletes one of their own requests
router.delete('/requests/:requestId',authorize('student'), controller.deleteRequest);

module.exports = router;
