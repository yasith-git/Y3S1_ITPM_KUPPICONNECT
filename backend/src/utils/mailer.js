/**
 * mailer.js
 *
 * Two-mode email transport:
 *
 * MODE 1 — Gmail (production)
 *   Requires EMAIL_USER + a 16-char Gmail App Password in EMAIL_PASS.
 *   Regular Gmail passwords are rejected by Google since May 2022.
 *   Get an App Password at: https://myaccount.google.com/apppasswords
 *
 * MODE 2 — Ethereal (automatic fallback for development/demo)
 *   Used automatically when Gmail credentials are missing, a placeholder,
 *   or Google rejects them.
 *   Emails are captured and viewable at https://ethereal.email/messages
 *   The preview URL for every email is printed to the Node console.
 *   Emails do NOT reach real inboxes in this mode.
 */
const nodemailer = require('nodemailer');

let _transporter   = null;   // the active nodemailer transport
let _etherealMode  = false;  // true when using Ethereal instead of Gmail
let _initPromise   = null;   // singleton init guard

/* ── helpers ──────────────────────────────────────────────────────── */

function isPlaceholderPassword(pass) {
  if (!pass || !pass.trim()) return true;
  if (pass.includes('xxxx'))  return true;
  // App Passwords are exactly 16 chars (no spaces). Anything shorter
  // or that looks like a regular password is treated as a placeholder.
  const stripped = pass.replace(/\s/g, '');
  return stripped.length < 16;
}

/* ── initialise transport ─────────────────────────────────────────── */

async function initTransporter() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();

  if (user && !isPlaceholderPassword(pass)) {
    // Try Gmail first
    const gmailTransport = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: false,   // STARTTLS
      auth:   { user, pass },
      tls:    { rejectUnauthorized: false },
    });

    try {
      await gmailTransport.verify();
      _transporter  = gmailTransport;
      _etherealMode = false;
      console.log(`[mailer] ✅ Gmail SMTP ready — sending from ${user}`);
      return;
    } catch (err) {
      if (err.message.includes('535') || err.message.toLowerCase().includes('credentials') || err.message.toLowerCase().includes('username and password')) {
        console.error('\n[mailer] ❌ GMAIL REJECTED THE PASSWORD');
        console.error('[mailer]    Cause: Regular Gmail passwords do NOT work for SMTP.');
        console.error('[mailer]    Fix:   Use a 16-character Gmail App Password.');
        console.error('[mailer]    → Sign into ' + user);
        console.error('[mailer]    → Enable 2-Step Verification at: https://myaccount.google.com/security');
        console.error('[mailer]    → Create App Password at:        https://myaccount.google.com/apppasswords');
        console.error('[mailer]    → Set EMAIL_PASS=<16charcode>   in backend/.env (no spaces)');
        console.error('[mailer]    ⚠️  Falling back to Ethereal preview mode.\n');
      } else {
        console.error('[mailer] ❌ Gmail SMTP error:', err.message);
        console.error('[mailer]    ⚠️  Falling back to Ethereal preview mode.\n');
      }
    }
  } else {
    if (!user) {
      console.warn('[mailer] ⚠️  EMAIL_USER is not set — using Ethereal preview mode.');
    } else {
      console.warn('[mailer] ⚠️  EMAIL_PASS is a placeholder — using Ethereal preview mode.');
      console.warn('[mailer]    Set a real Gmail App Password to send to real inboxes.');
      console.warn('[mailer]    Get one at: https://myaccount.google.com/apppasswords\n');
    }
  }

  // ── Ethereal fallback ────────────────────────────────────────────
  try {
    const account = await nodemailer.createTestAccount();
    _transporter  = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth:   { user: account.user, pass: account.pass },
    });
    _etherealMode = true;
    console.log('[mailer] 📧 Ethereal mode active — emails captured for preview.');
    console.log('[mailer]    View all sent emails at: https://ethereal.email/messages');
    console.log(`[mailer]    Ethereal login: ${account.user} / ${account.pass}\n`);
  } catch (etherealErr) {
    console.error('[mailer] ❌ Could not create Ethereal account:', etherealErr.message);
    _transporter = null;
  }
}

/* ── public API ───────────────────────────────────────────────────── */

async function getTransporter() {
  if (_transporter) return _transporter;
  if (!_initPromise) _initPromise = initTransporter();
  await _initPromise;
  return _transporter;
}

/** Called once from server.js after DB connects to eagerly init the transport. */
const verifyConnection = async () => {
  if (!_initPromise) _initPromise = initTransporter();
  await _initPromise;
};

/**
 * Send an email.
 * In Gmail mode  → delivered to the real inbox.
 * In Ethereal mode → captured; preview URL logged to console.
 */
const sendEmail = async ({ to, subject, html }) => {
  const t = await getTransporter();
  if (!t) {
    console.warn(`[mailer] No transport available — skipped email to ${to} (${subject})`);
    return;
  }

  const from = _etherealMode
    ? '"KuppiConnect" <noreply@kuppiconnect.com>'
    : (process.env.EMAIL_FROM || `KuppiConnect <${process.env.EMAIL_USER}>`);

  const info = await t.sendMail({ from, to, subject, html });

  if (_etherealMode) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[mailer] 📧 Email sent (preview): ${previewUrl}`);
    console.log(`[mailer]    To: ${to} | Subject: ${subject}`);
  }
};

/** Returns true when running in Ethereal mode (emails don't reach real inboxes) */
const isEtherealMode = () => _etherealMode;

module.exports = { sendEmail, verifyConnection, isEtherealMode };
