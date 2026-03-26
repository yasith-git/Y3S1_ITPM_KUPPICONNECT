require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { runMigrations } = require('./src/config/migrate');
const errorHandler = require('./src/middleware/errorHandler');
const { startReminderScheduler } = require('./src/modules/registration/reminderScheduler');
const { verifyConnection } = require('./src/utils/mailer');

// Route imports
const authRoutes = require('./src/modules/auth/routes');
const conductorRoutes = require('./src/modules/conductor/routes');
const announcementRoutes = require('./src/modules/announcement/routes');
const registrationRoutes = require('./src/modules/registration/routes');
const contentRoutes = require('./src/modules/content/routes');

const app = express();

// Connect to MongoDB, run migrations, then start background schedulers and verify SMTP
connectDB().then(async () => {
  await runMigrations();
  verifyConnection();
  startReminderScheduler();
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KuppiConnect API is running' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use.\nRun this to fix: Get-Process -Name node | Stop-Process -Force\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
