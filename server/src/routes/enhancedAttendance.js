
const express = require('express');
const { getEnhancedAttendanceData, exportEnhancedAttendanceToCsv } = require('../controllers/enhancedAttendanceController');

const router = express.Router();

// Get enhanced attendance data with filters and pagination
router.get('/', getEnhancedAttendanceData);
router.get('/export/csv', exportEnhancedAttendanceToCsv);

module.exports = router;
