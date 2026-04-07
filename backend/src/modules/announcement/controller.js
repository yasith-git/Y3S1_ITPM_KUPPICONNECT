const announcementService = require('./service');
const { sendSuccess } = require('../../utils/responseHandler');

const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.createAnnouncement(req.user._id, req.body);
    sendSuccess(res, announcement, 'Announcement created', 201);
  } catch (error) {
    next(error);
  }
};

const getAnnouncementsForClass = async (req, res, next) => {
  try {
    const announcements = await announcementService.getAnnouncementsForClass(
      req.params.classId,
      req.user._id,
      req.user.role
    );
    sendSuccess(res, announcements, 'Announcements fetched');
  } catch (error) {
    next(error);
  }
};

const getMyConductorAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getConductorAnnouncements(req.user._id);
    sendSuccess(res, announcements, 'Announcements fetched');
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      req.user._id,
      req.body
    );
    sendSuccess(res, announcement, 'Announcement updated');
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id, req.user._id);
    sendSuccess(res, null, 'Announcement deleted');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   LANDING ANNOUNCEMENT CONTROLLERS
   ════════════════════════════════════════════════════════════════════ */

const createLandingAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.createLandingAnnouncement(
      req.user._id,
      req.body,
      req.file // multer single('image')
    );
    sendSuccess(res, announcement, 'Landing announcement created', 201);
  } catch (error) {
    next(error);
  }
};

const getActiveLandingAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getActiveLandingAnnouncements();
    sendSuccess(res, announcements, 'Active announcements fetched');
  } catch (error) {
    next(error);
  }
};

const getUpcomingLandingAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getUpcomingLandingAnnouncements(req.user._id);
    sendSuccess(res, announcements, 'Upcoming announcements fetched');
  } catch (error) {
    next(error);
  }
};

const getExpiredLandingAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getExpiredLandingAnnouncements(req.user._id);
    sendSuccess(res, announcements, 'Expired announcements fetched');
  } catch (error) {
    next(error);
  }
};

const getMyConductorLandingAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getConductorLandingAnnouncements(req.user._id);
    sendSuccess(res, announcements, 'Landing announcements fetched');
  } catch (error) {
    next(error);
  }
};

const updateLandingAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.updateLandingAnnouncement(
      req.params.id,
      req.user._id,
      req.body,
      req.file
    );
    sendSuccess(res, announcement, 'Landing announcement updated');
  } catch (error) {
    next(error);
  }
};

const deleteLandingAnnouncement = async (req, res, next) => {
  try {
    await announcementService.deleteLandingAnnouncement(req.params.id, req.user._id);
    sendSuccess(res, null, 'Landing announcement deleted');
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════════
   CLASS-BASED ANNOUNCEMENT CONTROLLERS
   ════════════════════════════════════════════════════════════════════ */

const getUpcomingClassAnnouncements = async (req, res, next) => {
  try {
    const { subject, search } = req.query;
    const classes = await announcementService.getUpcomingClassAnnouncements({ subject, search });
    sendSuccess(res, classes, 'Upcoming classes fetched');
  } catch (error) {
    next(error);
  }
};

const getPastClassAnnouncements = async (req, res, next) => {
  try {
    const { subject, search, conductorId, page, limit } = req.query;
    const result = await announcementService.getPastClassAnnouncements({
      subject, search, conductorId, page, limit,
    });
    sendSuccess(res, result, 'Past classes fetched');
  } catch (error) {
    next(error);
  }
};

const getStudentPastClasses = async (req, res, next) => {
  try {
    const classes = await announcementService.getStudentPastClasses(req.user._id);
    sendSuccess(res, classes, 'Student past classes fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncementsForClass,
  getMyConductorAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  // ── Landing Announcements ───────────────────────────────────────────
  createLandingAnnouncement,
  getActiveLandingAnnouncements,
  getUpcomingLandingAnnouncements,
  getExpiredLandingAnnouncements,
  getMyConductorLandingAnnouncements,
  updateLandingAnnouncement,
  deleteLandingAnnouncement,
  // ── Class-based Announcements ───────────────────────────────────────
  getUpcomingClassAnnouncements,
  getPastClassAnnouncements,
  getStudentPastClasses,
};
