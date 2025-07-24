
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Import routes
const attendanceRoutes = require('./routes/attendance');
const scheduleRoutes = require('./routes/schedule');
const filtersRoutes = require('./routes/filters');
const enhancedAttendanceRoutes = require('./routes/enhancedAttendance');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/users');
const debugRoutes = require('./routes/debug');
const reportRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');
const { poolPromise } = require('./config/db');

// Import scheduler service for initialization
const { SchedulerService } = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Use routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/enhanced-attendance', enhancedAttendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as dbConnected');
    
    res.status(200).json({ 
      status: 'ok',
      database: result.recordset[0].dbConnected === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(200).json({ 
      status: 'ok',
      database: 'disconnected',
      message: 'Server is running but database is not available',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Also add the /api/health endpoint for consistency
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as dbConnected');
    
    res.status(200).json({ 
      status: 'ok',
      database: result.recordset[0].dbConnected === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(200).json({ 
      status: 'ok',
      database: 'disconnected',
      message: 'Server is running but database is not available',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize scheduler service
  try {
    const schedulerService = new SchedulerService();
    await schedulerService.initialize();
    console.log('✅ Scheduler service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler service:', error.message);
  }
});
