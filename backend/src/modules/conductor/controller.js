const conductorService = require('./service');
const { sendSuccess } = require('../../utils/responseHandler');

const createClass = async (req, res, next) => {
  try {
    const cls = await conductorService.createClass(req.user._id, req.body);
    sendSuccess(res, cls, 'Class created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAllClasses = async (req, res, next) => {
  try {
    const classes = await conductorService.getAllClasses(req.query);
    sendSuccess(res, classes, 'Classes fetched');
  } catch (error) {
    next(error);
  }
};

const getMyConductorClasses = async (req, res, next) => {
  try {
    const classes = await conductorService.getConductorClasses(req.user._id, req.query);
    sendSuccess(res, classes, 'My classes fetched');
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const cls = await conductorService.getClassById(req.params.id);
    sendSuccess(res, cls, 'Class fetched');
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const cls = await conductorService.updateClass(req.params.id, req.user._id, req.body);
    sendSuccess(res, cls, 'Class updated');
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    await conductorService.deleteClass(req.params.id, req.user._id);
    sendSuccess(res, null, 'Class deleted');
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const students = await conductorService.getClassStudents(req.params.id, req.user._id);
    sendSuccess(res, students, 'Students fetched');
  } catch (error) {
    next(error);
  }
};

const getPendingEnrollments = async (req, res, next) => {
  try {
    const enrollments = await conductorService.getPendingEnrollments(req.user._id);
    sendSuccess(res, enrollments, 'Pending enrollments fetched');
  } catch (error) {
    next(error);
  }
};

const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const enrollment = await conductorService.updateEnrollmentStatus(
      req.params.enrollmentId,
      req.user._id,
      status
    );
    sendSuccess(res, enrollment, `Enrollment ${status}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getMyConductorClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getPendingEnrollments,
  updateEnrollmentStatus,
  // ── Class Requests (conductor-side only) ──
  getConductorRequests,
  getPendingCount,
  updateRequestStatus,
};

/* ════════════════════════════════════════════════════════════════════
   CLASS REQUEST CONTROLLERS — Conductor side only.
   Student-side request submission/deletion lives in registration/.
   ════════════════════════════════════════════════════════════════════ */

/** GET /api/conductor/class-requests — conductor views all requests for their classes */
async function getConductorRequests(req, res, next) {
  try {
    const requests = await conductorService.getConductorRequests(req.user._id, req.query);
    sendSuccess(res, requests, 'Requests fetched');
  } catch (error) { next(error); }
}

/** GET /api/conductor/class-requests/pending-count — conductor gets pending request count */
async function getPendingCount(req, res, next) {
  try {
    const count = await conductorService.getPendingRequestCount(req.user._id);
    sendSuccess(res, { count }, 'Pending count fetched');
  } catch (error) { next(error); }
}

/** PUT /api/conductor/class-requests/:requestId/status — conductor acknowledges or dismisses a request */
async function updateRequestStatus(req, res, next) {
  try {
    const { status } = req.body;
    const request = await conductorService.updateRequestStatus(
      req.params.requestId,
      req.user._id,
      status,
    );
    sendSuccess(res, request, `Request ${status}`);
  } catch (error) { next(error); }
}
