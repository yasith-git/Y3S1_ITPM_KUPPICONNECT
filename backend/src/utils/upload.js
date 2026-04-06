const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/* ── Content upload (documents + images) ──────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/content';
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|ppt|pptx|png|jpg|jpeg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, PowerPoint, and image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/* ── Announcement image upload (images only) ──────────────────────── */
// Uses memory storage so the image buffer can be converted to a base64
// data-URL and stored directly in MongoDB.  This makes images accessible
// to every machine sharing the same database — no shared file-system needed.
const announcementStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = /png|jpg|jpeg|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = /image\/(png|jpe?g|webp)/.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, and WEBP image files are allowed'));
  }
};

const announcementUpload = multer({
  storage: announcementStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ── Notes upload (PDF only, max 20 MB) ──────────────────────────── */
const notesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/notes';
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const pdfFilter = (req, file, cb) => {
  const extOk  = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mimeOk = file.mimetype === 'application/pdf';
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const notesUpload = multer({
  storage: notesStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/* ── Comment image upload (images only, max 5 MB) ──────────────────── */
const commentImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/comment-images';
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const commentImageUpload = multer({
  storage: commentImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
module.exports.announcementUpload  = announcementUpload;
module.exports.notesUpload         = notesUpload;
module.exports.commentImageUpload  = commentImageUpload;
