const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const controller = require('./controller');

// ── Public routes ────────────────────────────────────────────────────
router.get('/classes', controller.getAllClasses);
router.get('/classes/:id', controller.getClassById);

// ── Conductor-only routes (applied to all routes below) ─────────────
router.use(protect, authorize('conductor'));

// Class management
router.post('/classes', controller.createClass);
router.get('/my-classes', controller.getMyConductorClasses);
router.put('/classes/:id', controller.updateClass);
router.delete('/classes/:id', controller.deleteClass);

// Student enrollment management
router.get('/classes/:id/students', controller.getClassStudents);
router.get('/enrollments/pending', controller.getPendingEnrollments);
router.put('/enrollments/:enrollmentId/status', controller.updateEnrollmentStatus);

// Class request management
router.get('/class-requests/pending-count', controller.getPendingCount);
router.get('/class-requests', controller.getConductorRequests);
router.put('/class-requests/:requestId/status', controller.updateRequestStatus);

module.exports = router;
