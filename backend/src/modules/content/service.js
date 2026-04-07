const mongoose = require('mongoose');
const fs   = require('fs');
const path = require('path');
const Content    = require('../../models/Content');
const Review     = require('../../models/Review');
const Enrollment = require('../../models/Enrollment');
const Class      = require('../../models/Class');
const User       = require('../../models/User');
const Comment    = require('../../models/Comment');
const Rating     = require('../../models/Rating');
const Note       = require('../../models/Note');

const uploadContent = async (conductorId, data, file) => {
  const cls = await Class.findOne({ _id: data.class, conductor: conductorId });
  if (!cls) {
    const error = new Error('Class not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const fileTypeMap = {
    pdf: 'pdf', doc: 'doc', docx: 'docx',
    ppt: 'ppt', pptx: 'pptx',
    png: 'image', jpg: 'image', jpeg: 'image',
  };

  const content = await Content.create({
    title: data.title,
    description: data.description || '',
    class: data.class,
    conductor: conductorId,
    fileUrl: `/uploads/content/${file.filename}`,
    fileName: file.originalname,
    fileType: fileTypeMap[ext] || 'other',
    fileSize: file.size,
  });

  return content;
};

const getContentForClass = async (classId, userId, userRole) => {
  if (userRole === 'student') {
    const enrolled = await Enrollment.findOne({ class: classId, student: userId, status: { $in: ['pending', 'approved'] } });
    if (!enrolled) {
      const error = new Error('You are not enrolled in this class');
      error.statusCode = 403;
      throw error;
    }
  } else {
    const cls = await Class.findOne({ _id: classId, conductor: userId });
    if (!cls) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }
  }

  const content = await Content.find({ class: classId })
    .populate('conductor', 'name')
    .sort({ createdAt: -1 });

  return content;
};

const getContentById = async (contentId, userId, userRole) => {
  const content = await Content.findById(contentId).populate('conductor', 'name');
  if (!content) {
    const error = new Error('Content not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'student') {
    const enrolled = await Enrollment.findOne({
      class: content.class,
      student: userId,
      status: { $in: ['pending', 'approved'] },
    });
    if (!enrolled) {
      const error = new Error('You are not enrolled in this class');
      error.statusCode = 403;
      throw error;
    }
  }

  return content;
};

const updateAiSummary = async (contentId, conductorId, aiSummary) => {
  const content = await Content.findOneAndUpdate(
    { _id: contentId, conductor: conductorId },
    { aiSummary },
    { new: true }
  );
  if (!content) {
    const error = new Error('Content not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  return content;
};

const deleteContent = async (contentId, conductorId) => {
  const content = await Content.findOneAndDelete({ _id: contentId, conductor: conductorId });
  if (!content) {
    const error = new Error('Content not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
};

// Reviews
const addReview = async (contentId, studentId, { rating, comment }) => {
  const content = await Content.findById(contentId);
  if (!content) {
    const error = new Error('Content not found');
    error.statusCode = 404;
    throw error;
  }

  const enrolled = await Enrollment.findOne({
    class: content.class,
    student: studentId,
    status: { $in: ['pending', 'approved'] },
  });
  if (!enrolled) {
    const error = new Error('You must be enrolled to review this content');
    error.statusCode = 403;
    throw error;
  }

  const review = await Review.create({ content: contentId, student: studentId, rating, comment });

  // Recalculate average rating
  const stats = await Review.aggregate([
    { $match: { content: content._id } },
    { $group: { _id: '$content', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Content.findByIdAndUpdate(contentId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }

  return review;
};

const getReviewsForContent = async (contentId) => {
  const reviews = await Review.find({ content: contentId })
    .populate('student', 'name profilePicture')
    .sort({ createdAt: -1 });
  return reviews;
};

const deleteReview = async (reviewId, studentId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, student: studentId });
  if (!review) {
    const error = new Error('Review not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  // Recalculate average rating
  const stats = await Review.aggregate([
    { $match: { content: review.content } },
    { $group: { _id: '$content', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Content.findByIdAndUpdate(review.content, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    await Content.findByIdAndUpdate(review.content, { averageRating: 0, totalReviews: 0 });
  }
};

/* ════════════════════════════════════════════════════════════════════
   COMMENTS — class discussion thread with one level of replies
   Access: approved-enrolled students OR the class conductor.
   ════════════════════════════════════════════════════════════════════ */

/** Verify the caller may interact with this class's discussion board. */
const assertDiscussionAccess = async (classId, userId, userRole) => {
  if (userRole === 'conductor') {
    const cls = await Class.findOne({ _id: classId, conductor: userId });
    if (!cls) throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  } else {
    const enrolled = await Enrollment.findOne({ class: classId, student: userId, status: { $in: ['pending', 'approved'] } });
    if (!enrolled) throw Object.assign(new Error('You must be enrolled to participate in the discussion'), { statusCode: 403 });
  }
};

const addComment = async (classId, userId, userRole, { text, imageUrl }) => {
  await assertDiscussionAccess(classId, userId, userRole);
  if (!text?.trim() && !imageUrl) {
    throw Object.assign(new Error('Comment cannot be empty'), { statusCode: 400 });
  }
  const comment = await Comment.create({
    class:  classId,
    author: userId,
    text:   text?.trim() || '',
    image:  imageUrl || '',
  });
  return Comment.findById(comment._id)
    .populate('author', 'name role profilePicture');
};

const addReply = async (classId, commentId, userId, userRole, { text, imageUrl }) => {
  await assertDiscussionAccess(classId, userId, userRole);
  if (!text?.trim() && !imageUrl) {
    throw Object.assign(new Error('Reply cannot be empty'), { statusCode: 400 });
  }
  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, class: classId },
    {
      $push: {
        replies: {
          author: userId,
          text:   text?.trim() || '',
          image:  imageUrl || '',
        },
      },
    },
    { new: true }
  )
    .populate('author',          'name role profilePicture')
    .populate('replies.author',  'name role profilePicture');

  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
  return comment;
};

const getComments = async (classId, userId, userRole) => {
  await assertDiscussionAccess(classId, userId, userRole);
  return Comment.find({ class: classId })
    .populate('author',         'name role profilePicture')
    .populate('replies.author', 'name role profilePicture')
    .sort({ createdAt: -1 });
};

const deleteComment = async (commentId, userId, userRole) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });

  if (String(comment.author) !== String(userId)) {
    throw Object.assign(new Error('Unauthorized — only the comment author can delete it'), { statusCode: 403 });
  }
  await comment.deleteOne();
};

/* ════════════════════════════════════════════════════════════════════
   RATINGS — 1-5 star per student per class
   Upsert model: submitted value replaces previous rating.
   After every change the conductor's aggregate (ratingAvg, ratingCount)
   on their User document is recalculated.
   ════════════════════════════════════════════════════════════════════ */

/** Recalculate and persist a conductor's overall average rating. */
const recalcConductorRating = async (conductorId) => {
  const conductorClasses = await Class.find({ conductor: conductorId }).select('_id');
  const classIds = conductorClasses.map(c => c._id);

  const result = await Rating.aggregate([
    { $match: { class: { $in: classIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg   = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length ? result[0].count : 0;
  await User.findByIdAndUpdate(conductorId, { ratingAvg: avg, ratingCount: count });
};

const addOrUpdateRating = async (classId, studentId, ratingValue) => {
  const cls = await Class.findById(classId);
  if (!cls) throw Object.assign(new Error('Class not found'), { statusCode: 404 });

  const enrolled = await Enrollment.findOne({ class: classId, student: studentId, status: { $in: ['pending', 'approved'] } });
  if (!enrolled) throw Object.assign(new Error('You must be enrolled to rate this class'), { statusCode: 403 });

  await Rating.findOneAndUpdate(
    { class: classId, student: studentId },
    { rating: ratingValue },
    { upsert: true, new: true, runValidators: true }
  );

  // Recalculate per-class stats
  const clsStats = await Rating.aggregate([
    { $match: { class: new mongoose.Types.ObjectId(classId) } },
    { $group: { _id: '$class', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const classAverage  = clsStats.length ? Math.round(clsStats[0].avg * 10) / 10 : 0;
  const classTotalCount = clsStats.length ? clsStats[0].count : 0;

  // Refresh conductor's profile-level aggregate
  await recalcConductorRating(cls.conductor);

  return { classId, average: classAverage, totalCount: classTotalCount, myRating: ratingValue };
};

const getRatings = async (classId, studentId) => {
  const stats = await Rating.aggregate([
    { $match: { class: new mongoose.Types.ObjectId(classId) } },
    { $group: {
        _id:          '$class',
        avg:          { $avg: '$rating' },
        count:        { $sum: 1 },
        allRatings:   { $push: '$rating' },
    }},
  ]);

  const average    = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  const totalCount = stats.length ? stats[0].count : 0;
  const allRatings = stats.length ? stats[0].allRatings : [];

  const distribution = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: allRatings.filter(r => r === star).length,
    pct:   totalCount ? Math.round((allRatings.filter(r => r === star).length / totalCount) * 100) : 0,
  }));

  const myRatingDoc = studentId
    ? await Rating.findOne({ class: classId, student: studentId }).select('rating')
    : null;

  return { average, totalCount, myRating: myRatingDoc?.rating || 0, distribution };
};

/* Student: all ratings they have ever submitted, with class title populated */
const getMyRatings = async (userId) => {
  return Rating.find({ student: userId })
    .populate('class', 'title subject')
    .sort({ createdAt: -1 });
};

/* Conductor: aggregate rating per class for all their classes */
const getClassesWithRatings = async (conductorId) => {
  const classes = await Class.find({ conductor: conductorId }).select('title subject');
  if (!classes.length) return [];

  const classIds = classes.map(c => c._id);
  const aggregates = await Rating.aggregate([
    { $match: { class: { $in: classIds } } },
    { $group: { _id: '$class', average: { $avg: '$rating' }, totalCount: { $sum: 1 } } },
  ]);

  const ratingMap = {};
  aggregates.forEach(a => { ratingMap[String(a._id)] = a; });

  return classes.map(cls => ({
    classId:    cls._id,
    title:      cls.title,
    subject:    cls.subject,
    average:    ratingMap[String(cls._id)]   ? Math.round(ratingMap[String(cls._id)].average * 10) / 10 : 0,
    totalCount: ratingMap[String(cls._id)]?.totalCount ?? 0,
  }));
};

/* ════════════════════════════════════════════════════════════════════
   NOTES — PDF files uploaded by the conductor for a specific class.
   Only that class's conductor can upload/edit/delete.
   Only approved-enrolled students of that class can read/download.
   CRUD: create, list, update (rename/retitle), delete.
   ════════════════════════════════════════════════════════════════════ */

const uploadNote = async (classId, conductorId, { title, description }, file) => {
  const cls = await Class.findOne({ _id: classId, conductor: conductorId });
  if (!cls) throw Object.assign(new Error('Class not found or unauthorized'), { statusCode: 404 });

  return Note.create({
    class:       classId,
    conductor:   conductorId,
    title:       title?.trim() || file.originalname,
    description: description?.trim() || '',
    fileUrl:     `/uploads/notes/${file.filename}`,
    fileName:    file.originalname,
    fileSize:    file.size,
  });
};

const getNotes = async (classId, userId, userRole) => {
  if (userRole === 'student') {
    const enrolled = await Enrollment.findOne({ class: classId, student: userId, status: { $in: ['pending', 'approved'] } });
    if (!enrolled) throw Object.assign(new Error('You must be enrolled to access class notes'), { statusCode: 403 });
  } else {
    const cls = await Class.findOne({ _id: classId, conductor: userId });
    if (!cls) throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  }
  return Note.find({ class: classId })
    .populate('conductor', 'name')
    .sort({ createdAt: -1 });
};

const updateNote = async (noteId, conductorId, { title, description }) => {
  if (!title?.trim()) throw Object.assign(new Error('Title is required'), { statusCode: 400 });
  const note = await Note.findOneAndUpdate(
    { _id: noteId, conductor: conductorId },
    { title: title.trim(), description: description?.trim() || '' },
    { new: true, runValidators: true }
  );
  if (!note) throw Object.assign(new Error('Note not found or unauthorized'), { statusCode: 404 });
  return note;
};

const deleteNote = async (noteId, conductorId) => {
  const note = await Note.findOneAndDelete({ _id: noteId, conductor: conductorId });
  if (!note) throw Object.assign(new Error('Note not found or unauthorized'), { statusCode: 404 });

  // Best-effort: remove physical file from disk
  try {
    const absPath = path.join(process.cwd(), note.fileUrl);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (err) {
    console.warn('[content] Note file delete failed:', err.message);
  }
};

/* ════════════════════════════════════════════════════════════════════
   AI SUMMARY (simulation)
   Reads all comments for a class and performs keyword-based sentiment
   analysis, mirroring the logic in the frontend AISummary component so
   results are consistent whether generated client-side or server-side.
   ════════════════════════════════════════════════════════════════════ */

/* ── Internal helper: read DB comments + run keyword/sentiment analysis ── */
const runAnalysis = async (classId) => {
  const comments = await Comment.find({ class: classId });

  const flatTexts = [];
  comments.forEach(c => {
    if (c.text) flatTexts.push(c.text.toLowerCase());
    c.replies?.forEach(r => { if (r.text) flatTexts.push(r.text.toLowerCase()); });
  });

  const total = flatTexts.length;

  if (total === 0) {
    return {
      total:   0,
      label:   'No Data',
      icon:    '💬',
      color:   'text-slate-500',
      posPct:  0,
      negPct:  0,
      sugPct:  0,
      themes:  [],
      summary: 'No comments to analyse yet. Once students post comments, the AI can generate a summary.',
    };
  }

  const joined = flatTexts.join(' ');

  const POS = ['excellent','great','good','helpful','clear','best','amazing','wonderful','love','perfect',
               'understand','easy','fantastic','awesome','brilliant','enjoyed','impressed','recommend'];
  const NEG = ['difficult','confusing','hard','bad','poor','slow','boring','unclear','complicated',
               'struggle','lost','confused','disappointed','waste','rushed'];
  const SUG = ['suggest','improve','should','could','maybe','hope','wish','better','more examples'];

  let pos = 0, neg = 0, sug = 0;
  POS.forEach(w => { if (joined.includes(w)) pos++; });
  NEG.forEach(w => { if (joined.includes(w)) neg++; });
  SUG.forEach(w => { if (joined.includes(w)) sug++; });

  const totalSignals = pos + neg + sug || 1;
  const posPct = Math.round((pos / totalSignals) * 100);
  const negPct = Math.round((neg / totalSignals) * 100);
  const sugPct = Math.max(0, 100 - posPct - negPct);

  let label, icon, color;
  if      (posPct >= 60)  { label = 'Very Positive';     icon = '🌟'; color = 'text-ok'; }
  else if (posPct >= 40)  { label = 'Mostly Positive';   icon = '👍'; color = 'text-ok'; }
  else if (neg >= pos)    { label = 'Needs Improvement'; icon = '⚠️';  color = 'text-err'; }
  else                    { label = 'Mixed Feedback';    icon = '🤔'; color = 'text-amber-600'; }

  const themes = [];
  if (/explain|clear|understand/.test(joined))      themes.push('Explanation Quality');
  if (/pace|speed|slow|fast/.test(joined))           themes.push('Teaching Pace');
  if (/content|material|topic|syllabus/.test(joined)) themes.push('Content Depth');
  if (/example|practice|problem|exercise/.test(joined)) themes.push('Practical Examples');
  if (/time|duration|long|short/.test(joined))      themes.push('Session Duration');
  if (/helpful|useful|informative/.test(joined))    themes.push('Helpfulness');
  if (/interact|engage|question|doubt/.test(joined))  themes.push('Student Interaction');
  if (/note|slide|pdf|material/.test(joined))       themes.push('Study Materials');
  if (themes.length === 0) themes.push('General Experience', 'Teaching Quality');

  const summary = posPct >= 40
    ? `Students are responding positively to this class. The majority of comments reflect satisfaction with the teaching experience and content delivery.${
        sug > 0 ? ' A few students also offered constructive suggestions for further improvement.' : ''
      } Overall this class is well-regarded within the student community.`
    : `Student feedback for this class shows mixed or critical sentiments. Some students appreciate the session content, while others have highlighted areas that need attention.${
        sug > 0 ? ' Several constructive suggestions were noted and may be worth reviewing.' : ''
      }`;

  return { total, label, icon, color, posPct, negPct, sugPct, themes, summary };
};

/* GET /summary/:classId — returns cached summary if available, else live analysis (not saved) */
const getAISummary = async (classId) => {
  const cls = await Class.findById(classId).select('aiSummary aiSummaryAt');
  if (cls?.aiSummary) {
    return { ...cls.aiSummary, cached: true, aiSummaryAt: cls.aiSummaryAt };
  }
  return runAnalysis(classId);
};

/* POST /summary/:classId — always regenerates and persists to Class document */
const saveAISummary = async (classId) => {
  const result = await runAnalysis(classId);
  const now = new Date();
  await Class.findByIdAndUpdate(classId, { aiSummary: result, aiSummaryAt: now });
  return { ...result, cached: false, aiSummaryAt: now };
};

module.exports = {
  // ── Existing content & reviews ──────────────────────────────────────
  uploadContent,
  getContentForClass,
  getContentById,
  updateAiSummary,
  deleteContent,
  addReview,
  getReviewsForContent,
  deleteReview,
  // ── Comments ────────────────────────────────────────────────────────
  addComment,
  addReply,
  getComments,
  deleteComment,
  // ── Ratings ─────────────────────────────────────────────────────────
  addOrUpdateRating,
  getRatings,  getMyRatings,
  getClassesWithRatings,  // ── Notes ───────────────────────────────────────────────────────────
  uploadNote,
  getNotes,
  updateNote,
  deleteNote,
  // ── AI Summary ──────────────────────────────────────────────────────
  getAISummary,  saveAISummary,};
