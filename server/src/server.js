
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('./routes/attendance');
const scheduleRoutes = require('./routes/schedule');
const filtersRoutes = require('./routes/filters');
const enhancedAttendanceRoutes = require('./routes/enhancedAttendance');
const { poolPromise } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/enhanced-attendance', enhancedAttendanceRoutes);

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
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
