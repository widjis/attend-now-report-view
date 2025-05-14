
const express = require('express');
const { getScheduleData } = require('../controllers/scheduleController');

const router = express.Router();

// Get schedule data with filters and pagination
router.get('/', getScheduleData);

module.exports = router;
