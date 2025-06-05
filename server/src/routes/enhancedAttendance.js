
const express = require('express');
const { getEnhancedAttendanceData, exportEnhancedAttendanceToCsv, exportEnhancedAttendanceToPdf, exportEnhancedAttendanceToXlsx } = require('../controllers/enhancedAttendanceController');

const router = express.Router();

// Get enhanced attendance data with filters and pagination
router.get('/', getEnhancedAttendanceData);
router.get('/export/csv', exportEnhancedAttendanceToCsv);
router.get('/export/pdf', exportEnhancedAttendanceToPdf);
router.get('/export/xlsx', exportEnhancedAttendanceToXlsx);

module.exports = router;
