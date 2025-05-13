
const express = require('express');
const { getEmployeeSchedule } = require('../controllers/employeeController');

const router = express.Router();

// Get employee schedule data with filters and pagination
router.get('/schedule', getEmployeeSchedule);

module.exports = router;
