
const express = require('express');
const { getScheduleData } = require('../controllers/scheduleController');
const { 
  getScheduleData: getScheduleDataNew,
  getFilterOptions,
  getEmployeeDetails,
  getOrganizationHierarchy,
  getScheduleDataLegacy
} = require('../controllers/scheduleControllerNew');

const router = express.Router();

// Legacy endpoint - uses CardDBTimeSchedule table
router.get('/legacy', getScheduleDataLegacy);

// New endpoint - uses MTIUsers table (default)
router.get('/', getScheduleDataNew);

// Get filter options for dropdowns
router.get('/filters', getFilterOptions);

// Get employee details by ID
router.get('/employee/:employeeId', getEmployeeDetails);

// Get organization hierarchy
router.get('/organization', getOrganizationHierarchy);

// Backward compatibility - keep old endpoint working
router.get('/old', getScheduleData);

module.exports = router;
