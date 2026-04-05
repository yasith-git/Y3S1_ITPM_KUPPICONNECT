const LandingAnnouncement = require('../models/LandingAnnouncement');

/**
 * Runs lightweight one-time data migrations on server startup.
 *
 * Each migration is idempotent — safe to run every boot because it only
 * touches documents that still need fixing and skips all others.
 */
async function runMigrations() {
  // Migration: clear stale disk-path images from LandingAnnouncement.
  //
  // Early versions stored images as local file paths
  // (e.g. "uploads/announcements/123.jpg").  Those paths only exist on
  // the machine that uploaded the file, so every other machine sees a
  // broken image.  Images are now stored as base64 data-URLs directly in
  // MongoDB, making them accessible from any machine.
  //
  // This migration sets any remaining file-path image fields to null so
  // the UI shows the clean letter-avatar fallback instead of a broken icon.
  const result = await LandingAnnouncement.updateMany(
    {
      image: { $nin: [null, ''] },
      $expr: { $not: { $regexMatch: { input: '$image', regex: '^data:' } } },
    },
    { $set: { image: null } }
  );

  if (result.modifiedCount > 0) {
    console.log(`[migrate] Cleared ${result.modifiedCount} broken disk-path image(s) from LandingAnnouncement.`);
  }
}

module.exports = { runMigrations };
