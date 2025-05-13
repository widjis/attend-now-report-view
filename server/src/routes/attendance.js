
const express = require('express');
const { getAttendanceData, getAttendanceSummary } = require('../controllers/attendanceController');
const { exportToCsv, exportToPdf } = require('../controllers/exportController');

const router = express.Router();

// Get attendance data with filters and pagination
router.get('/', getAttendanceData);

// Get summary statistics for dashboard
router.get('/summary', getAttendanceSummary);

// Export endpoints
router.get('/export/csv', exportToCsv);
router.get('/export/pdf', exportToPdf);

module.exports = router;
