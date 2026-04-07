/**
 * registration/controller.js — Member 3 (Registration feature)
 *
 * HTTP handlers for:
 *  A. Student enrollment (enroll, view, cancel)
 *  B. Student class-topic requests (submit, view, delete)
 */
const registrationService = require('./service');
const { sendSuccess } = require('../../utils/responseHandler');

/* ════════════════════════════════════════════════════════════════════
   A. ENROLLMENT CONTROLLERS
   ════════════════════════════════════════════════════════════════════ */

/** POST /api/registration/enroll — student registers for a class */
const enrollInClass = async (req, res, next) => {
  try {
    const { classId, studentDetails } = req.body;
    const enrollment = await registrationService.enrollInClass(req.user._id, classId, studentDetails);
    sendSuccess(res, enrollment, 'Enrollment request submitted', 201);
  } catch (error) {
    next(error);
  }
};

/** GET /api/registration/my-enrollments — student views all their enrollments */
const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await registrationService.getStudentEnrollments(req.user._id);
    sendSuccess(res, enrollments, 'Enrollments fetched');
  } catch (error) {
    next(error);
  }
};

/** GET /api/registration/my-enrollments/:id — student views a single enrollment */
const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await registrationService.getEnrollmentById(req.params.id, req.user._id);
    sendSuccess(res, enrollment, 'Enrollment fetched');
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/registration/my-enrollments/:id — student cancels an enrollment */
const cancelEnrollment = async (req, res, next) => {
  try {
    await registrationService.cancelEnrollment(req.params.id, req.user._id);
    sendSuccess(res, null, 'Enrollment cancelled');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/registration/my-classes
 * Returns { registeredClasses, completedClasses } for the dashboard and My Classes tabs.
 * registeredClasses = enrollments whose class dateTime is in the future
 * completedClasses  = enrollments whose class dateTime has already passed
 */
const getMyClasses = async (req, res, next) => {
  try {
    const data = await registrationService.getMyClassesSplit(req.user._id);
    sendSuccess(res, data, 'Classes fetched');
  } catch (error) {
    next(error);
  }
};

/** POST /api/registration/send-confirmation/:id — conductor triggers confirmation email */
const sendConfirmationEmail = async (req, res, next) => {
  try {
    await registrationService.sendEnrollmentConfirmationEmail(req.params.id);
    sendSuccess(res, null, 'Confirmation email sent');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/registration/test-email
 * Body: { to: "email@example.com" }
 * Sends a test email so you can verify SMTP credentials are correct.
 */
const testEmail = async (req, res, next) => {
  try {
    const { isEtherealMode } = require('../../utils/mailer');
    const to = req.body?.to || req.user?.email;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Provide a "to" email in the request body.' });
    }
    await registrationService.sendTestEmail(to);
    const mode = isEtherealMode() ? 'ethereal-preview' : 'gmail';
    const message = mode === 'ethereal-preview'
      ? 'Test email sent via Ethereal preview — check Node console for the preview URL (emails do NOT reach real inboxes in this mode)'
      : `Test email sent via Gmail to ${to} — check your inbox`;
    sendSuccess(res, { sentTo: to, mode }, message);
  } catch (error) {
    next(error);
  }
};

/** GET /api/registration/export/:classId — conductor exports student list to Excel */
const exportToExcel = async (req, res, next) => {
  try {
    const workbook = await registrationService.exportEnrollmentsToExcel(
      req.params.classId,
      req.user._id
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=students-${req.params.classId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   B. STUDENT CLASS-REQUEST CONTROLLERS
   Students submit topic/class requests to conductors.
   Conductor-side management lives in conductor/controller.js.
   ════════════════════════════════════════════════════════════════════ */

/** POST /api/registration/requests — student submits a new topic request */
const createRequest = async (req, res, next) => {
  try {
    const request = await registrationService.createRequest(req.user._id, req.body);
    sendSuccess(res, request, 'Request submitted successfully', 201);
  } catch (error) { next(error); }
};

/** GET /api/registration/requests — student views their own requests */
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await registrationService.getStudentRequests(req.user._id);
    sendSuccess(res, requests, 'Requests fetched');
  } catch (error) { next(error); }
};

/** DELETE /api/registration/requests/:requestId — student deletes their own request */
const deleteRequest = async (req, res, next) => {
  try {
    await registrationService.deleteRequest(req.params.requestId, req.user._id);
    sendSuccess(res, null, 'Request deleted');
  } catch (error) { next(error); }
};

module.exports = {
  // Enrollment
  enrollInClass,
  getMyEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  getMyClasses,
  sendConfirmationEmail,
  testEmail,
  exportToExcel,
  // Class requests (student side)
  createRequest,
  getMyRequests,
  deleteRequest,
};
