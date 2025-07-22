const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');

// Route to check users table schema
router.get('/check-users-schema', authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query to get column information for users table
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH 
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = 'users'
    `);
    
    res.status(200).json({
      success: true,
      schema: result.recordset
    });
    
  } catch (error) {
    console.error('Error checking users schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check users schema',
      error: error.message
    });
  }
});

module.exports = router;