/**
 * registration/service.js — Member 3 (Registration feature)
 *
 * Business logic for:
 *  A. Student class enrollment (enroll, view, cancel)
 *  B. Student class-topic requests (submit, view, delete)
 *     — Conductor-side request management (view all, update status) lives in conductor/service.js
 *
 * Duplicate-registration prevention (two layers):
 *  1. Primary:   Enrollment.findOne({ student, class }) — same MongoDB user ID
 *  2. Secondary: Cross-account email check — same email address used on a different account
 *
 * enrolledCount is incremented atomically with $inc on every new enrollment
 * and decremented when the student cancels, so the conductor dashboard always
 * reflects the correct number.
 *
 * After a successful enrollment, a confirmation email is sent to the student
 * containing the meeting link or venue — this is the ONLY place the link is shared.
 */
const Enrollment = require('../../models/Enrollment');
const Class      = require('../../models/Class');
const User       = require('../../models/User');
const ClassRequest = require('../../models/ClassRequest');
const { sendEmail } = require('../../utils/mailer');
const ExcelJS = require('exceljs');

const enrollInClass = async (studentId, classId, studentDetails) => {
  const cls = await Class.findById(classId).populate('conductor', 'name email meetingLink');
  if (!cls || cls.status !== 'active') {
    const error = new Error('Class not found or not active');
    error.statusCode = 404;
    throw error;
  }

  if (cls.enrolledCount >= cls.capacity) {
    const error = new Error('Class is full');
    error.statusCode = 400;
    throw error;
  }

  // Duplicate check by student ID (authenticated user)
  const existingById = await Enrollment.findOne({ student: studentId, class: classId });
  if (existingById) {
    const error = new Error('You are already registered for this class');
    error.statusCode = 400;
    throw error;
  }

  // Duplicate check by email — catches the same person using a different account
  if (studentDetails?.phone) {
    const studentUser = await User.findById(studentId).select('email');
    const emailToCheck = studentUser?.email;
    if (emailToCheck) {
      const sameEmailUser = await User.findOne({ email: emailToCheck, _id: { $ne: studentId } }).select('_id');
      if (sameEmailUser) {
        const existingByEmail = await Enrollment.findOne({ student: sameEmailUser._id, class: classId });
        if (existingByEmail) {
          const error = new Error('An account with this email is already registered for this class');
          error.statusCode = 400;
          throw error;
        }
      }
    }
  }

  const enrollment = await Enrollment.create({
    student: studentId,
    class: classId,
    studentDetails,
    status: 'approved',
  });

  // Increment the class enrolled count atomically
  await Class.findByIdAndUpdate(classId, { $inc: { enrolledCount: 1 } });

  const populated = await Enrollment.findById(enrollment._id).populate([
    { path: 'student', select: 'name email' },
    { path: 'class', select: 'title subject dateTime meetingLink location classType conductor' },
  ]);

  // Send confirmation email with meeting link / venue details
  try {
    const student = populated.student;
    const classDoc = populated.class;
    const dt = classDoc.dateTime ? new Date(classDoc.dateTime) : null;
    const dateStr = dt ? dt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const timeStr = dt ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

    const locationInfo = classDoc.classType === 'physical'
      ? `<p style="margin:0;color:#64748b;font-size:13px;">📍 Venue: ${classDoc.location || '—'}</p>`
      : classDoc.meetingLink
        ? `<p style="margin:0;color:#64748b;font-size:13px;">💻 Meeting Link: <a href="${classDoc.meetingLink}" style="color:#0ea5e9;">${classDoc.meetingLink}</a></p>`
        : '';

    await sendEmail({
      to:      student.email,
      subject: `Registration Confirmed — ${classDoc.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Registration Confirmed! 🎉</h1>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;">
            <p style="color:#334155;margin:0 0 12px;">Dear <strong>${student.name}</strong>,</p>
            <p style="color:#64748b;margin:0 0 20px;">Your registration for the following class has been received and is pending conductor approval:</p>
            <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #0ea5e9;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:16px;"><strong>${classDoc.title}</strong></p>
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📚 ${classDoc.subject || ''}</p>
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📅 ${dateStr}</p>
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">🕐 ${timeStr}</p>
              ${locationInfo}
            </div>
            <p style="color:#64748b;margin:0 0 16px;">You will receive a follow-up email once your registration is <strong>approved by the conductor</strong>.</p>
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Thank you for choosing KuppiConnect.</p>
            <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — enrollment was created but email failed
    console.error('[registration] Confirmation email failed:', emailErr.message);
  }

  return populated;
};

const getStudentEnrollments = async (studentId) => {
  const enrollments = await Enrollment.find({ student: studentId })
    .populate({
      path: 'class',
      select: 'title subject dateTime monthlyFee classType location meetingLink coverImage status conductor capacity enrolledCount',
      populate: { path: 'conductor', select: 'name email' },
    })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
  return enrollments;
};

const getEnrollmentById = async (enrollmentId, studentId) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, student: studentId })
    .populate('class')
    .populate('student', 'name email');

  if (!enrollment) {
    const error = new Error('Enrollment not found');
    error.statusCode = 404;
    throw error;
  }
  return enrollment;
};

const cancelEnrollment = async (enrollmentId, studentId) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, student: studentId })
    .populate('student', 'name email')
    .populate('class', 'title subject dateTime classType location');

  if (!enrollment) {
    const error = new Error('Enrollment not found');
    error.statusCode = 404;
    throw error;
  }

  // Capture populated data before deletion (JS objects stay in memory)
  const studentName  = enrollment.student.name;
  const studentEmail = enrollment.student.email;
  const cls          = enrollment.class;

  await Class.findByIdAndUpdate(cls._id, { $inc: { enrolledCount: -1 } });
  await enrollment.deleteOne();

  // Send cancellation confirmation email (non-fatal)
  try {
    const dt      = cls.dateTime ? new Date(cls.dateTime) : null;
    const dateStr = dt
      ? dt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '—';
    const timeStr = dt ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

    await sendEmail({
      to:      studentEmail,
      subject: `Registration Cancelled — ${cls.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#475569,#1e293b);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Registration Cancelled</h1>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;">
            <p style="color:#334155;margin:0 0 12px;">Dear <strong>${studentName}</strong>,</p>
            <p style="color:#64748b;margin:0 0 20px;">Your registration for the following class has been successfully cancelled:</p>
            <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #64748b;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:16px;"><strong>${cls.title}</strong></p>
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📚 ${cls.subject}</p>
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📅 ${dateStr}</p>
              <p style="margin:0;color:#64748b;font-size:13px;">🕐 ${timeStr}</p>
            </div>
            <p style="color:#64748b;margin:0 0 8px;">We hope to see you in future sessions at KuppiConnect.</p>
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">If this was a mistake, you can re-register at any time.</p>
            <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — cancellation was already processed
    console.error('[registration] Cancellation email failed:', emailErr.message);
  }
};

const sendEnrollmentConfirmationEmail = async (enrollmentId) => {
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('student', 'name email')
    .populate('class', 'title subject');

  if (!enrollment) {
    const error = new Error('Enrollment not found');
    error.statusCode = 404;
    throw error;
  }

  const html = `
    <h2>Enrollment Confirmation</h2>
    <p>Dear ${enrollment.student.name},</p>
    <p>Your enrollment in <strong>${enrollment.class.title}</strong> (${enrollment.class.subject}) has been <strong>${enrollment.status}</strong>.</p>
    <p>Status: <strong>${enrollment.status.toUpperCase()}</strong></p>
    <br/>
    <p>Thank you for using KuppiConnect!</p>
  `;

  await sendEmail({
    to: enrollment.student.email,
    subject: `Enrollment ${enrollment.status} - ${enrollment.class.title}`,
    html,
  });
};

const exportEnrollmentsToExcel = async (classId, conductorId) => {
  const cls = await Class.findOne({ _id: classId, conductor: conductorId });
  if (!cls) {
    const error = new Error('Class not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const enrollments = await Enrollment.find({ class: classId, status: 'approved' })
    .populate('student', 'name email');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');

  sheet.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Guardian Name', key: 'guardianName', width: 20 },
    { header: 'Guardian Phone', key: 'guardianPhone', width: 15 },
    { header: 'Enrolled At', key: 'enrolledAt', width: 20 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
  ];

  enrollments.forEach((e, index) => {
    sheet.addRow({
      no: index + 1,
      name: e.student.name,
      email: e.student.email,
      phone: e.studentDetails?.phone || '',
      address: e.studentDetails?.address || '',
      guardianName: e.studentDetails?.guardianName || '',
      guardianPhone: e.studentDetails?.guardianPhone || '',
      enrolledAt: e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '',
      paymentStatus: e.paymentStatus,
    });
  });

  // Style the header row
  sheet.getRow(1).font = { bold: true };

  return workbook;
};

/**
 * Split student enrollments into registeredClasses (class date in future)
 * and completedClasses (class date in past).
 * This powers both the My Classes tabs and the dashboard count.
 */
const getMyClassesSplit = async (studentId) => {
  const now = new Date();
  const enrollments = await Enrollment.find({ student: studentId })
    .populate({
      path: 'class',
      select: 'title subject dateTime monthlyFee classType location meetingLink coverImage status conductor capacity enrolledCount',
      populate: { path: 'conductor', select: 'name email' },
    })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

  const registeredClasses = enrollments.filter(e => e.class && new Date(e.class.dateTime) > now);
  const completedClasses  = enrollments.filter(e => e.class && new Date(e.class.dateTime) <= now);

  return { registeredClasses, completedClasses };
};

/**
 * Send the 2-day reminder email for a populated enrollment.
 * Called by reminderScheduler — HTML template is defined here so all
 * email templates stay in one place (service layer).
 */
const sendReminderEmail = async (enrollment) => {
  const cls     = enrollment.class;
  const student = enrollment.student;

  const dt      = cls.dateTime ? new Date(cls.dateTime) : null;
  const dateStr = dt
    ? dt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const timeStr = dt
    ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const conductor    = cls.conductor?.name ?? '—';
  const locationInfo = cls.classType === 'physical'
    ? `<p style="margin:0;color:#64748b;font-size:13px;">📍 Venue: ${cls.location || '—'}</p>`
    : `<p style="margin:0;color:#64748b;font-size:13px;">💻 Meeting link was sent in your registration confirmation email.</p>`;

  await sendEmail({
    to:      student.email,
    subject: `⏰ Class Reminder — ${cls.title} is in 2 Days`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">⏰</div>
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Class Reminder — 2 Days Away</h1>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;margin:0 0 12px;">Dear <strong>${student.name}</strong>,</p>
          <p style="color:#64748b;margin:0 0 20px;">Your upcoming class starts in <strong>2 days</strong>. Here are the details:</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
            <p style="margin:0 0 8px;color:#0f172a;font-size:16px;"><strong>${cls.title}</strong></p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📚 ${cls.subject}</p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📅 ${dateStr}</p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">🕐 ${timeStr}</p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">🎓 Conductor: ${conductor}</p>
            ${locationInfo}
          </div>
          <p style="color:#64748b;margin:0 0 16px;">Please make sure you are prepared and ready to join on time.</p>
          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Good luck! 🍀</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send a test email to verify SMTP credentials are working.
 * Called via POST /api/registration/test-email (conductor/dev only).
 */
const sendTestEmail = async (toEmail) => {
  await sendEmail({
    to:      toEmail,
    subject: '✅ KuppiConnect — Email Test',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:24px 28px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Email Test Successful! ✅</h1>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px 28px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;margin:0 0 10px;">Your KuppiConnect email configuration is working correctly.</p>
          <p style="color:#64748b;font-size:13px;margin:0;">Registration, cancellation, and reminder emails will now be delivered.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
        </div>
      </div>
    `,
  });
};

/* ════════════════════════════════════════════════════════════════════
   B. STUDENT CLASS-REQUEST FUNCTIONS
   Students submit topic requests to conductors.
   Conductor-side management (view all, update status) is in conductor/.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Submit a new topic/class request to a conductor.
 * @param {ObjectId} studentId - authenticated student
 * @param {Object}   data      - { conductorId, relatedClassId, subject, topic, description }
 */
const createRequest = async (studentId, data) => {
  const { conductorId, relatedClassId, subject, topic, description } = data;

  if (!conductorId) throw Object.assign(new Error('Conductor ID is required'), { statusCode: 400 });
  if (!subject?.trim()) throw Object.assign(new Error('Subject is required'), { statusCode: 400 });
  if (!topic?.trim()) throw Object.assign(new Error('Topic is required'), { statusCode: 400 });

  const request = await ClassRequest.create({
    student:      studentId,
    conductor:    conductorId,
    relatedClass: relatedClassId || null,
    subject:      subject.trim(),
    topic:        topic.trim(),
    description:  description?.trim() || '',
  });

  await request.populate([
    { path: 'student',      select: 'name email profilePicture' },
    { path: 'conductor',    select: 'name email profilePicture' },
    { path: 'relatedClass', select: 'title subject' },
  ]);

  return request;
};

/**
 * Get all requests submitted by a specific student.
 * @param {ObjectId} studentId
 */
const getStudentRequests = async (studentId) => {
  return ClassRequest.find({ student: studentId })
    .populate('conductor',    'name email profilePicture')
    .populate('relatedClass', 'title subject dateTime')
    .sort({ createdAt: -1 });
};

/**
 * Delete a student's own request.
 * Students can only delete requests they own.
 * @param {string}   requestId
 * @param {ObjectId} studentId
 */
const deleteRequest = async (requestId, studentId) => {
  const request = await ClassRequest.findOneAndDelete({ _id: requestId, student: studentId });
  if (!request) throw Object.assign(new Error('Request not found or unauthorized'), { statusCode: 404 });
};

/**
 * Send a welcome email when a new account is successfully created.
 * Works for both students and conductors — the content adapts to the role.
 * Called from auth/service.js after User.create().
 */
const sendWelcomeEmail = async ({ name, email, role }) => {
  const isStudent   = role === 'student';
  const roleLabel   = isStudent ? 'Student' : 'Conductor';
  const accentColor = isStudent ? '#0ea5e9' : '#8b5cf6';
  const darkColor   = isStudent ? '#0284c7' : '#7c3aed';

  const roleSpecificContent = isStudent
    ? `
      <p style="color:#64748b;margin:0 0 16px;">As a student you can:</p>
      <ul style="color:#64748b;font-size:13px;margin:0 0 20px;padding-left:20px;line-height:1.8;">
        <li>Browse and register for upcoming classes</li>
        <li>Receive class reminders 2 days before each session</li>
        <li>Track your registered and completed classes</li>
        <li>Request topics from conductors</li>
      </ul>`
    : `
      <p style="color:#64748b;margin:0 0 16px;">As a conductor you can:</p>
      <ul style="color:#64748b;font-size:13px;margin:0 0 20px;padding-left:20px;line-height:1.8;">
        <li>Create and manage your classes</li>
        <li>Review and approve student registrations</li>
        <li>Upload notes and content for your students</li>
        <li>Post announcements to keep students informed</li>
      </ul>`;

  await sendEmail({
    to:      email,
    subject: `Welcome to KuppiConnect, ${name}! 🎉`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,${accentColor},${darkColor});padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <div style="font-size:44px;margin-bottom:8px;">${isStudent ? '🎓' : '👨‍🏫'}</div>
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Welcome to KuppiConnect!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${roleLabel} Account Created</p>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;margin:0 0 12px;">Dear <strong>${name}</strong>,</p>
          <p style="color:#64748b;margin:0 0 20px;">
            Your <strong>${roleLabel}</strong> account has been successfully created.
            You can now sign in and start using KuppiConnect.
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid ${accentColor};border-radius:8px;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;color:#0f172a;font-size:13px;"><strong>Account Details</strong></p>
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;">📧 Email: ${email}</p>
            <p style="margin:0;color:#64748b;font-size:13px;">👤 Role: ${roleLabel}</p>
          </div>
          ${roleSpecificContent}
          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">If you did not create this account, please ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  // ── Enrollment ──────────────────────────────────────────────────────
  enrollInClass,
  getStudentEnrollments,
  getMyClassesSplit,
  getEnrollmentById,
  cancelEnrollment,
  sendEnrollmentConfirmationEmail,
  exportEnrollmentsToExcel,
  sendReminderEmail,
  sendWelcomeEmail,
  sendTestEmail,
  // ── Student Class Requests ──────────────────────────────────────────
  createRequest,
  getStudentRequests,
  deleteRequest,
};
