const mongoose = require('mongoose');

/**
 * LandingAnnouncement — broadcast announcements posted by conductors
 * that appear on the public landing page with time-based visibility.
 *
 * Status is derived on-the-fly via a virtual (not stored):
 *   active   → startDate <= now <= endDate
 *   upcoming → startDate > now
 *   expired  → endDate   < now
 */
const landingAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    image: {
      type: String,
      default: null, // base64 data-URL (data:image/...;base64,...) stored directly in MongoDB
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * How many minutes this announcement should be displayed per rotation
     * on the landing-page carousel.  Minimum 1, maximum 60.
     */
    displayDuration: {
      type: Number,
      default: 1,
      min: [1, 'Display duration must be at least 1 minute'],
      max: [60, 'Display duration cannot exceed 60 minutes'],
    },
  },
  { timestamps: true }
);

/* ── Virtual: compute status from dates ──────────────────────────── */
landingAnnouncementSchema.virtual('status').get(function () {
  const now = new Date();
  if (this.endDate < now) return 'expired';
  if (this.startDate > now) return 'upcoming';
  return 'active';
});

landingAnnouncementSchema.set('toJSON', { virtuals: true });
landingAnnouncementSchema.set('toObject', { virtuals: true });

/* ── Validate endDate > startDate at the schema level ────────────── */
landingAnnouncementSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    const err = new Error('End date must be after start date');
    err.statusCode = 400;
    return next(err);
  }
  next();
});

/* ── Indexes for efficient date-range queries ─────────────────────── */
landingAnnouncementSchema.index({ startDate: 1, endDate: 1 });
landingAnnouncementSchema.index({ conductor: 1, createdAt: -1 });

module.exports = mongoose.model('LandingAnnouncement', landingAnnouncementSchema);
