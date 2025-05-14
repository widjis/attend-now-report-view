
const express = require('express');
const { getEnhancedAttendanceData } = require('../controllers/enhancedAttendanceController');

const router = express.Router();

// Get enhanced attendance data with filters and pagination
router.get('/', getEnhancedAttendanceData);

module.exports = router;
