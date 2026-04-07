const User = require('../../models/User');
const { generateToken } = require('../../utils/generateToken');
const { sendWelcomeEmail } = require('../registration/service');

// Consistent user shape returned to client (never exposes password)
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
  bio: user.bio,
  phone: user.phone,
  university: user.university,
  faculty: user.faculty,
  yearOfStudy: user.yearOfStudy,
  title: user.title,
  subjects: user.subjects,
  // Conductor rating aggregate (auto-updated on every student rating)
  ratingAvg:   user.ratingAvg   ?? 0,
  ratingCount: user.ratingCount ?? 0,
});

const registerUser = async ({ name, email, password, role, phone }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password, role, phone: phone || '' });
  const token = generateToken(user._id);

  // Send welcome email — non-fatal, account is created regardless
  sendWelcomeEmail({ name: user.name, email: user.email, role: user.role }).catch(err =>
    console.error('[auth] Welcome email failed:', err.message)
  );

  return {
    token,
    user: formatUser(user),
  };
};

const loginUser = async ({ email, password, role }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Strict role validation — reject if selected role does not match account role
  if (role && user.role !== role) {
    const error = new Error(`Invalid role selected. This account is registered as "${user.role}". Please select the correct role.`);
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: formatUser(user),
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return formatUser(user);
};

const updateProfile = async (userId, updates) => {
  const allowed = [
    'name', 'bio', 'profilePicture', 'phone',
    // student fields
    'university', 'faculty', 'yearOfStudy',
    // conductor fields
    'title', 'subjects',
  ];
  const filteredUpdates = Object.keys(updates)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

  const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return formatUser(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.matchPassword(currentPassword))) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, changePassword };
