const Class = require('../../models/Class');
const Enrollment = require('../../models/Enrollment');
const ClassRequest = require('../../models/ClassRequest');

function buildDateTime(date, time) {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}:00`);
  return isNaN(dt.getTime()) ? null : dt;
}

const createClass = async (conductorId, data) => {
  const { title, description, subject, date, time, meetingLink, location, classType, seats, fee, duration } = data;

  if (!title?.trim()) throw Object.assign(new Error('Class title is required'), { statusCode: 400 });
  if (!subject?.trim()) throw Object.assign(new Error('Subject is required'), { statusCode: 400 });
  if (!description?.trim()) throw Object.assign(new Error('Description is required'), { statusCode: 400 });

  const type = classType === 'physical' ? 'physical' : 'online';

  if (type === 'online') {
    if (!meetingLink?.trim()) throw Object.assign(new Error('Meeting link is required for online classes'), { statusCode: 400 });
  } else {
    if (!location?.trim()) throw Object.assign(new Error('Venue/location is required for physical classes'), { statusCode: 400 });
  }

  const dateTime = buildDateTime(date, time);
  if (!dateTime) throw Object.assign(new Error('Valid date and time are required'), { statusCode: 400 });
  if (dateTime <= new Date()) throw Object.assign(new Error('Class date must be in the future'), { statusCode: 400 });

  const newClass = await Class.create({
    title: title.trim(),
    description: description.trim(),
    subject: subject.trim(),
    conductor: conductorId,
    dateTime,
    classType: type,
    meetingLink: type === 'online' ? (meetingLink?.trim() ?? '') : '',
    location:    type === 'physical' ? (location?.trim() ?? '') : '',
    capacity: Number(seats) || 50,
    monthlyFee: Number(fee) || 0,
    duration: duration || '',
    status: 'active',
  });

  await newClass.populate('conductor', 'name email profilePicture bio title university subjects');
  return newClass;
};

const getAllClasses = async (filters = {}) => {
  const query = { status: 'active' };
  if (filters.subject) query.subject = new RegExp(filters.subject, 'i');
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { subject: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
    ];
  }

  const classes = await Class.find(query)
    .populate('conductor', 'name email profilePicture bio title university subjects')
    .sort({ dateTime: 1 });
  return classes;
};

const getConductorClasses = async (conductorId, filters = {}) => {
  const query = { conductor: conductorId };
  if (filters.subject) query.subject = new RegExp(filters.subject, 'i');
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { subject: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
    ];
  }
  if (filters.upcoming === 'true') query.dateTime = { $gte: new Date() };

  const classes = await Class.find(query)
    .populate('conductor', 'name email profilePicture bio title university subjects')
    .sort({ dateTime: 1 });
  return classes;
};

const getClassById = async (classId) => {
  const cls = await Class.findById(classId)
    .populate('conductor', 'name email profilePicture bio title university subjects phone');
  if (!cls) throw Object.assign(new Error('Class not found'), { statusCode: 404 });
  return cls;
};

const updateClass = async (classId, conductorId, updates) => {
  const cls = await Class.findOne({ _id: classId, conductor: conductorId });
  if (!cls) throw Object.assign(new Error('Class not found or unauthorized'), { statusCode: 404 });

  const { title, description, subject, date, time, meetingLink, location, classType, seats, fee, duration, status } = updates;

  if (title !== undefined) cls.title = title.trim();
  if (description !== undefined) cls.description = description.trim();
  if (subject !== undefined) cls.subject = subject.trim();
  if (duration !== undefined) cls.duration = duration;
  if (status !== undefined) cls.status = status;
  if (seats !== undefined) cls.capacity = Number(seats);
  if (fee !== undefined) cls.monthlyFee = Number(fee) || 0;

  if (classType !== undefined) {
    cls.classType = classType;
    if (classType === 'online') {
      if (meetingLink !== undefined) cls.meetingLink = meetingLink.trim();
      cls.location = '';
    } else {
      if (location !== undefined) cls.location = location.trim();
      cls.meetingLink = '';
    }
  } else {
    if (meetingLink !== undefined) cls.meetingLink = meetingLink.trim();
    if (location !== undefined) cls.location = location.trim();
  }

  if (date && time) {
    const newDateTime = buildDateTime(date, time);
    if (!newDateTime) throw Object.assign(new Error('Invalid date or time'), { statusCode: 400 });
    if (newDateTime <= new Date()) throw Object.assign(new Error('Class date must be in the future'), { statusCode: 400 });
    cls.dateTime = newDateTime;
  }

  await cls.save();
  await cls.populate('conductor', 'name email profilePicture bio title university subjects');
  return cls;
};

const deleteClass = async (classId, conductorId) => {
  const cls = await Class.findOneAndDelete({ _id: classId, conductor: conductorId });
  if (!cls) {
    const error = new Error('Class not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
};

const getClassStudents = async (classId, conductorId) => {
  const cls = await Class.findOne({ _id: classId, conductor: conductorId });
  if (!cls) {
    const error = new Error('Class not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const enrollments = await Enrollment.find({ class: classId, status: 'approved' })
    .populate('student', 'name email profilePicture')
    .sort({ enrolledAt: -1 });

  return enrollments;
};

const getPendingEnrollments = async (conductorId) => {
  const conductorClasses = await Class.find({ conductor: conductorId }).select('_id');
  const classIds = conductorClasses.map((c) => c._id);

  const enrollments = await Enrollment.find({ class: { $in: classIds }, status: 'pending' })
    .populate('student', 'name email profilePicture')
    .populate('class', 'title subject')
    .sort({ createdAt: -1 });

  return enrollments;
};

const updateEnrollmentStatus = async (enrollmentId, conductorId, status) => {
  const enrollment = await Enrollment.findById(enrollmentId).populate('class');
  if (!enrollment) {
    const error = new Error('Enrollment not found');
    error.statusCode = 404;
    throw error;
  }

  if (enrollment.class.conductor.toString() !== conductorId.toString()) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const previousStatus = enrollment.status;
  enrollment.status = status;
  await enrollment.save();

  // Update enrolled count
  if (status === 'approved' && previousStatus !== 'approved') {
    await Class.findByIdAndUpdate(enrollment.class._id, { $inc: { enrolledCount: 1 } });
  } else if (previousStatus === 'approved' && status !== 'approved') {
    await Class.findByIdAndUpdate(enrollment.class._id, { $inc: { enrolledCount: -1 } });
  }

  return enrollment;
};

module.exports = {
  createClass,
  getAllClasses,
  getConductorClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getPendingEnrollments,
  updateEnrollmentStatus,
  // ── Class Requests (conductor-side only) ──────────────────────────
  getConductorRequests,
  getPendingRequestCount,
  updateRequestStatus,
};

/* ── Class Request helpers (conductor-side only) ─────────────────── */

async function getConductorRequests(conductorId, filters = {}) {
  const query = { conductor: conductorId };
  if (filters.status && filters.status !== 'all') query.status = filters.status;

  return ClassRequest.find(query)
    .populate('student', 'name email profilePicture')
    .populate('relatedClass', 'title subject dateTime')
    .sort({ createdAt: -1 });
}

async function getPendingRequestCount(conductorId) {
  return ClassRequest.countDocuments({ conductor: conductorId, status: 'pending' });
}

async function updateRequestStatus(requestId, conductorId, status) {
  const allowed = ['acknowledged', 'dismissed'];
  if (!allowed.includes(status)) {
    throw Object.assign(new Error(`Status must be one of: ${allowed.join(', ')}`), { statusCode: 400 });
  }

  const request = await ClassRequest.findOne({ _id: requestId, conductor: conductorId });
  if (!request) throw Object.assign(new Error('Request not found or unauthorized'), { statusCode: 404 });

  request.status = status;
  await request.save();

  await request.populate([
    { path: 'student', select: 'name email profilePicture' },
    { path: 'relatedClass', select: 'title subject' },
  ]);

  return request;
}


