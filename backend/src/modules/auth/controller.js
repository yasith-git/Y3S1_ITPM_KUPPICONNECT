const authService = require('./service');
const { sendSuccess } = require('../../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const result = await authService.registerUser({ name, email, password, role, phone });
    sendSuccess(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.loginUser({ email, password, role });
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);
    sendSuccess(res, user, 'Profile fetched');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
