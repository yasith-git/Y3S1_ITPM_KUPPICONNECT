const Announcement = require('../../models/Announcement');
const LandingAnnouncement = require('../../models/LandingAnnouncement');
const Class = require('../../models/Class');
const Enrollment = require('../../models/Enrollment');
const User = require('../../models/User');
const { sendEmail } = require('../../utils/mailer');

const createAnnouncement = async (conductorId, data) => {
  const cls = await Class.findOne({ _id: data.class, conductor: conductorId });
  if (!cls) {
    const error = new Error('Class not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const status = data.isScheduled ? 'scheduled' : 'sent';
  const sentAt = data.isScheduled ? null : new Date();

  const announcement = await Announcement.create({
    ...data,
    conductor: conductorId,
    status,
    sentAt,
  });

  // Send email notifications to enrolled students (non-blocking)
  if (!data.isScheduled) {
    notifyStudents(announcement, cls).catch(console.error);
  }

  return announcement;
};

const notifyStudents = async (announcement, cls) => {
  const enrollments = await Enrollment.find({ class: cls._id, status: 'approved' })
    .populate('student', 'email name');

  const emails = enrollments.map((e) => e.student.email);
  if (emails.length === 0) return;

  const html = `
    <h2>${announcement.title}</h2>
    <p><strong>Class:</strong> ${cls.title}</p>
    <p><strong>Type:</strong> ${announcement.type.toUpperCase()}</p>
    <hr/>
    <p>${announcement.content}</p>
  `;

  for (const email of emails) {
    await sendEmail({ to: email, subject: `[${cls.title}] ${announcement.title}`, html });
  }
};

const getAnnouncementsForClass = async (classId, userId, userRole) => {
  if (userRole === 'conductor') {
    const cls = await Class.findOne({ _id: classId, conductor: userId });
    if (!cls) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }
  } else {
    const enrolled = await Enrollment.findOne({ class: classId, student: userId, status: { $in: ['pending', 'approved'] } });
    if (!enrolled) {
      const error = new Error('You are not enrolled in this class');
      error.statusCode = 403;
      throw error;
    }
  }

  const announcements = await Announcement.find({ class: classId })
    .populate('conductor', 'name')
    .sort({ createdAt: -1 });

  return announcements;
};

const getConductorAnnouncements = async (conductorId) => {
  const announcements = await Announcement.find({ conductor: conductorId })
    .populate('class', 'title subject')
    .sort({ createdAt: -1 });
  return announcements;
};

const updateAnnouncement = async (announcementId, conductorId, updates) => {
  const announcement = await Announcement.findOne({ _id: announcementId, conductor: conductorId });
  if (!announcement) {
    const error = new Error('Announcement not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const allowed = ['title', 'content', 'type', 'scheduledAt'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) announcement[field] = updates[field];
  });

  await announcement.save();
  return announcement;
};

const deleteAnnouncement = async (announcementId, conductorId) => {
  const announcement = await Announcement.findOneAndDelete({
    _id: announcementId,
    conductor: conductorId,
  });
  if (!announcement) {
    const error = new Error('Announcement not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
};

/* ════════════════════════════════════════════════════════════════════
   LANDING PAGE ANNOUNCEMENT FUNCTIONS
   Conductors publish broadcast announcements visible on the landing
   page.  Status is time-based (active / upcoming / expired) and is
   computed on-the-fly — no background job required.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Create a new landing announcement.
 * @param {ObjectId} conductorId
 * @param {Object}   data          - { title, description, startDate, endDate, displayDuration }
 * @param {Object}   [imageFile]   - multer file object (optional)
 */
const createLandingAnnouncement = async (conductorId, data, imageFile) => {
  const { title, description, startDate, endDate, displayDuration } = data;

  if (!title?.trim()) throw Object.assign(new Error('Title is required'), { statusCode: 400 });
  if (!description?.trim()) throw Object.assign(new Error('Description is required'), { statusCode: 400 });
  if (!startDate) throw Object.assign(new Error('Start date is required'), { statusCode: 400 });
  if (!endDate) throw Object.assign(new Error('End date is required'), { statusCode: 400 });

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) throw Object.assign(new Error('Invalid start date'), { statusCode: 400 });
  if (isNaN(end.getTime())) throw Object.assign(new Error('Invalid end date'), { statusCode: 400 });
  if (end <= start) throw Object.assign(new Error('End date must be after start date'), { statusCode: 400 });

  const imageDataUrl = imageFile
    ? `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`
    : null;

  const announcement = await LandingAnnouncement.create({
    title: title.trim(),
    description: description.trim(),
    image: imageDataUrl,
    startDate: start,
    endDate: end,
    conductor: conductorId,
    displayDuration: displayDuration ? Math.max(1, Math.min(60, Number(displayDuration))) : 1,
  });

  await announcement.populate('conductor', 'name email profilePicture');
  return announcement;
};

/**
 * Get all ACTIVE announcements for the public landing page.
 * Returns every conductor's active announcements sorted by creation date.
 * The frontend carousel uses each item's `displayDuration` (minutes) to
 * control how long each slide is shown.
 */
const getActiveLandingAnnouncements = async () => {
  const now = new Date();
  return LandingAnnouncement.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate('conductor', 'name profilePicture')
    .sort({ createdAt: -1 });
};

/**
 * Get all UPCOMING announcements (startDate in the future).
 * Used in the conductor dashboard "Upcoming" tab.
 * @param {ObjectId} conductorId - only return this conductor's upcoming items
 */
const getUpcomingLandingAnnouncements = async (conductorId) => {
  const now = new Date();
  const filter = { startDate: { $gt: now } };
  if (conductorId) filter.conductor = conductorId;

  return LandingAnnouncement.find(filter)
    .populate('conductor', 'name profilePicture')
    .sort({ startDate: 1 }); // soonest first
};

/**
 * Get all EXPIRED announcements (endDate in the past).
 * Used in the conductor dashboard "Expired" tab.
 * @param {ObjectId} conductorId - only return this conductor's expired items
 */
const getExpiredLandingAnnouncements = async (conductorId) => {
  const now = new Date();
  const filter = { endDate: { $lt: now } };
  if (conductorId) filter.conductor = conductorId;

  return LandingAnnouncement.find(filter)
    .populate('conductor', 'name profilePicture')
    .sort({ endDate: -1 }); // most recently expired first
};

/**
 * Get ALL landing announcements for a conductor (all statuses).
 * Used in the conductor dashboard main list.
 * @param {ObjectId} conductorId
 */
const getConductorLandingAnnouncements = async (conductorId) => {
  return LandingAnnouncement.find({ conductor: conductorId })
    .populate('conductor', 'name profilePicture')
    .sort({ createdAt: -1 });
};

/**
 * Update a conductor's own landing announcement.
 * @param {string}   id          - announcement _id
 * @param {ObjectId} conductorId - must own the record
 * @param {Object}   data        - fields to update
 * @param {Object}   [imageFile] - optional new image
 */
const updateLandingAnnouncement = async (id, conductorId, data, imageFile) => {
  const announcement = await LandingAnnouncement.findOne({ _id: id, conductor: conductorId });
  if (!announcement) {
    throw Object.assign(new Error('Announcement not found or unauthorized'), { statusCode: 404 });
  }

  const { title, description, startDate, endDate, displayDuration } = data;

  if (title !== undefined) announcement.title = title.trim();
  if (description !== undefined) announcement.description = description.trim();
  if (imageFile) {
    announcement.image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
  }

  if (startDate !== undefined) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) throw Object.assign(new Error('Invalid start date'), { statusCode: 400 });
    announcement.startDate = start;
  }
  if (endDate !== undefined) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) throw Object.assign(new Error('Invalid end date'), { statusCode: 400 });
    announcement.endDate = end;
  }
  if (announcement.endDate <= announcement.startDate) {
    throw Object.assign(new Error('End date must be after start date'), { statusCode: 400 });
  }
  if (displayDuration !== undefined) {
    announcement.displayDuration = Math.max(1, Math.min(60, Number(displayDuration)));
  }

  await announcement.save();
  await announcement.populate('conductor', 'name email profilePicture');
  return announcement;
};

/**
 * Delete a conductor's own landing announcement.
 * @param {string}   id          - announcement _id
 * @param {ObjectId} conductorId - must own the record
 */
const deleteLandingAnnouncement = async (id, conductorId) => {
  const announcement = await LandingAnnouncement.findOneAndDelete({
    _id: id,
    conductor: conductorId,
  });
  if (!announcement) {
    throw Object.assign(new Error('Announcement not found or unauthorized'), { statusCode: 404 });
  }
};

/* ════════════════════════════════════════════════════════════════════
   CLASS-BASED ANNOUNCEMENT FUNCTIONS
   When a conductor creates a class it acts as a time-boxed announcement:
     • Before dateTime  → "upcoming"  – shown on the public home page
     • After  dateTime  → "past"      – removed from home, shown on the
                                        Past Classes page for everyone.

   Registered students also see their past classes in the student
   dashboard under the "Completed" tab.
   All functions live here (announcement folder) as required.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Upcoming classes — public.
 * Only classes whose dateTime is in the future, sorted newest-created first
 * so the most recently added class appears at the top of the home page.
 * Supports optional subject / search text filters.
 *
 * @param {Object} filters - { subject, search }
 */
const getUpcomingClassAnnouncements = async (filters = {}) => {
  const now = new Date();
  const query = { status: 'active', dateTime: { $gt: now } };

  if (filters.subject && filters.subject !== 'All') {
    query.subject = new RegExp(filters.subject, 'i');
  }
  if (filters.search) {
    query.$or = [
      { title:       new RegExp(filters.search, 'i') },
      { subject:     new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
    ];
  }

  return Class.find(query)
    .populate('conductor', 'name email profilePicture bio title university subjects')
    .sort({ createdAt: -1 });      // newest class added first
};

/**
 * Past classes — public.
 * Classes whose dateTime has already passed. Visible to everyone including
 * non-enrolled students so they can browse the conductor's history and
 * open the class-details page (which hosts the chat / notes feature).
 *
 * @param {Object} filters - { subject, search, conductorId, page, limit }
 */
const getPastClassAnnouncements = async (filters = {}) => {
  const now = new Date();
  const query = { status: 'active', dateTime: { $lte: now } };

  if (filters.subject && filters.subject !== 'All') {
    query.subject = new RegExp(filters.subject, 'i');
  }
  if (filters.search) {
    query.$or = [
      { title:       new RegExp(filters.search, 'i') },
      { subject:     new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
    ];
  }
  if (filters.conductorId) {
    query.conductor = filters.conductorId;
  }

  const page  = Math.max(1, parseInt(filters.page,  10) || 1);
  const limit = Math.min(50, parseInt(filters.limit, 10) || 20);
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Class.find(query)
      .populate('conductor', 'name email profilePicture bio title university subjects')
      .sort({ dateTime: -1 })              // most recently completed first
      .skip(skip)
      .limit(limit),
    Class.countDocuments(query),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

/**
 * A logged-in student's own past (completed) classes.
 * Only returns classes the student was enrolled in (approved) that
 * have already passed — shown in the student dashboard "Completed" tab.
 *
 * @param {ObjectId} studentId
 */
const getStudentPastClasses = async (studentId) => {
  const now = new Date();

  const enrollments = await Enrollment.find({ student: studentId, status: 'approved' })
    .populate({
      path: 'class',
      populate: { path: 'conductor', select: 'name email profilePicture' },
    });

  const past = enrollments
    .filter(e => e.class && e.class.dateTime && new Date(e.class.dateTime) <= now)
    .map(e => ({
      enrollment: e._id,
      classId:    e.class._id,
      class:      e.class,
    }));

  return past;
};

module.exports = {
  createAnnouncement,
  getAnnouncementsForClass,
  getConductorAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  // ── Landing Announcements ───────────────────────────────────────────
  createLandingAnnouncement,
  getActiveLandingAnnouncements,
  getUpcomingLandingAnnouncements,
  getExpiredLandingAnnouncements,
  getConductorLandingAnnouncements,
  updateLandingAnnouncement,
  deleteLandingAnnouncement,
  // ── Class-based Announcements ───────────────────────────────────────
  getUpcomingClassAnnouncements,
  getPastClassAnnouncements,
  getStudentPastClasses,
};
