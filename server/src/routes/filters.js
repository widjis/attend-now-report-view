
const express = require('express');
const { getFilterOptions } = require('../controllers/filtersController');

const router = express.Router();

// Get filter options (departments, companies, card types)
router.get('/', getFilterOptions);

module.exports = router;
