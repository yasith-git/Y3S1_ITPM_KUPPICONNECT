/**
 * registration/reminderScheduler.js
 *
 * Runs every hour. Sends a 2-day reminder email to every student
 * whose class starts between 47 h and 48 h from now.
 *
 * Email content is built in service.js (sendReminderEmail) alongside
 * the registration and cancellation email templates.
 * This file only handles scheduling and DB queries.
 */

const cron = require('node-cron');
const Enrollment = require('../../models/Enrollment');
const { sendReminderEmail } = require('./service');

async function sendReminders() {
  const now     = new Date();
  const windowFrom = new Date(now.getTime() + 47 * 60 * 60 * 1000);
  const windowTo   = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const enrollments = await Enrollment.find({ reminder2DaySent: false })
    .populate({
      path: 'class',
      select: 'title subject dateTime classType location conductor',
      populate: { path: 'conductor', select: 'name' },
    })
    .populate('student', 'name email');

  let sent = 0;

  for (const enrollment of enrollments) {
    const cls = enrollment.class;
    if (!cls?.dateTime) continue;
    if (!enrollment.student?.email) continue;

    const classTime = new Date(cls.dateTime);
    if (classTime < windowFrom || classTime >= windowTo) continue;

    try {
      await sendReminderEmail(enrollment);
      await Enrollment.findByIdAndUpdate(enrollment._id, { reminder2DaySent: true });
      sent++;
      console.log(`[reminderScheduler] Sent 2-day reminder → ${enrollment.student.email} (${cls.title})`);
    } catch (err) {
      console.error(`[reminderScheduler] Failed for ${enrollment.student.email}:`, err.message);
    }
  }

  if (sent > 0) {
    console.log(`[reminderScheduler] ✅ ${sent} reminder(s) sent.`);
  }
}

function startReminderScheduler() {
  console.log('[reminderScheduler] Started — checks every hour for classes 2 days away.');

  // Run once immediately on server start
  sendReminders().catch(err =>
    console.error('[reminderScheduler] Initial run error:', err.message)
  );

  // Then every hour at :00
  cron.schedule('0 * * * *', () => {
    sendReminders().catch(err =>
      console.error('[reminderScheduler] Scheduled run error:', err.message)
    );
  });
}

module.exports = { startReminderScheduler };


/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function buildReminderHtml({ studentName, classTitle, classSubject, dateStr, timeStr, conductor, locationInfo, daysLabel }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">⏰</div>
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Class Reminder — ${daysLabel}</h1>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;">
        <p style="color:#334155;margin:0 0 12px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#64748b;margin:0 0 20px;">
          This is your <strong>${daysLabel} reminder</strong> for your upcoming class:
        </p>
        <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;color:#0f172a;font-size:16px;"><strong>${classTitle}</strong></p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📚 ${classSubject}</p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;">📅 ${dateStr}</p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;">🕐 ${timeStr}</p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;">🎓 Conductor: ${conductor}</p>
          ${locationInfo}
        </div>
        <p style="color:#64748b;margin:0 0 8px;">Please make sure you are prepared and ready to join on time.</p>
        <p style="color:#64748b;margin:0 0 16px;">
          Your meeting link or venue details were sent in your original registration confirmation email.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Good luck! 🍀</p>
        <p style="color:#94a3b8;font-size:12px;margin:0;">— The KuppiConnect Team</p>
      </div>
    </div>
  `;
}

async function sendReminders() {
  const now = new Date();

  /* ── Window boundaries ─────────────────────────────────────────── */
  // 2-day window: class starts 47 h – 48 h from now
  const twoDay = {
    from: new Date(now.getTime() + 47 * 60 * 60 * 1000),
    to:   new Date(now.getTime() + 48 * 60 * 60 * 1000),
  };
  // 1-day window: class starts 23 h – 24 h from now
  const oneDay = {
    from: new Date(now.getTime() + 23 * 60 * 60 * 1000),
    to:   new Date(now.getTime() + 24 * 60 * 60 * 1000),
  };

  /* ── Fetch eligible enrollments ────────────────────────────────── */
  const enrollments = await Enrollment.find({
    $or: [
      { reminder2DaySent: false },
      { reminder1DaySent: false },
    ],
  })
    .populate({
      path: 'class',
      select: 'title subject dateTime classType location meetingLink conductor',
      populate: { path: 'conductor', select: 'name' },
    })
    .populate('student', 'name email');

  let sent2Day = 0;
  let sent1Day = 0;

  for (const enrollment of enrollments) {
    const cls = enrollment.class;
    if (!cls || !cls.dateTime) continue;

    const student = enrollment.student;
    if (!student?.email) continue;

    const classTime = new Date(cls.dateTime);

    const dt      = cls.dateTime ? new Date(cls.dateTime) : null;
    const dateStr = dt
      ? dt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '—';
    const timeStr = dt
      ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '—';

    const conductor = cls.conductor?.name ?? '—';

    const locationInfo = cls.classType === 'physical'
      ? `<p style="margin:0;color:#64748b;font-size:13px;">📍 Venue: ${cls.location || '—'}</p>`
      : `<p style="margin:0;color:#64748b;font-size:13px;">💻 Meeting link was sent in your confirmation email.</p>`;

    /* ── 2-day reminder ──────────────────────────────────────────── */
    if (!enrollment.reminder2DaySent && classTime >= twoDay.from && classTime < twoDay.to) {
      try {
        await sendEmail({
          to:      student.email,
          subject: `⏰ Class Reminder (2 Days) — ${cls.title}`,
          html:    buildReminderHtml({
            studentName: student.name,
            classTitle:  cls.title,
            classSubject: cls.subject,
            dateStr,
            timeStr,
            conductor,
            locationInfo,
            daysLabel: '2 Days Away',
          }),
        });
        await Enrollment.findByIdAndUpdate(enrollment._id, { reminder2DaySent: true });
        sent2Day++;
        console.log(`[reminderScheduler] 2-day reminder sent → ${student.email} (${cls.title})`);
      } catch (err) {
        console.error(`[reminderScheduler] Failed 2-day reminder for ${student.email}:`, err.message);
      }
    }

    /* ── 1-day reminder ──────────────────────────────────────────── */
    if (!enrollment.reminder1DaySent && classTime >= oneDay.from && classTime < oneDay.to) {
      try {
        await sendEmail({
          to:      student.email,
          subject: `⏰ Class Reminder (Tomorrow) — ${cls.title}`,
          html:    buildReminderHtml({
            studentName: student.name,
            classTitle:  cls.title,
            classSubject: cls.subject,
            dateStr,
            timeStr,
            conductor,
            locationInfo,
            daysLabel: '1 Day Away (Tomorrow!)',
          }),
        });
        await Enrollment.findByIdAndUpdate(enrollment._id, { reminder1DaySent: true });
        sent1Day++;
        console.log(`[reminderScheduler] 1-day reminder sent → ${student.email} (${cls.title})`);
      } catch (err) {
        console.error(`[reminderScheduler] Failed 1-day reminder for ${student.email}:`, err.message);
      }
    }
  }

  if (sent2Day + sent1Day > 0) {
    console.log(`[reminderScheduler] ✅ Sent ${sent2Day} two-day + ${sent1Day} one-day reminders.`);
  }
}

/**
 * Start the scheduler.
 * Runs once every hour at :00 minutes.
 * Called once from server.js after DB connects.
 */
function startReminderScheduler() {
  console.log('[reminderScheduler] Reminder scheduler started — runs every hour.');

  // Run once immediately so we don't wait an hour on server start
  sendReminders().catch(err =>
    console.error('[reminderScheduler] Initial run error:', err.message)
  );

  // Then run every hour at the top of the hour
  cron.schedule('0 * * * *', () => {
    sendReminders().catch(err =>
      console.error('[reminderScheduler] Scheduled run error:', err.message)
    );
  });
}

module.exports = { startReminderScheduler };
