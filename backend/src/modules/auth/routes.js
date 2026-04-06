const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const controller = require('./controller');

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.get('/profile', protect, controller.getProfile);
router.put('/profile', protect, controller.updateProfile);
router.put('/change-password', protect, controller.changePassword);

module.exports = router;
