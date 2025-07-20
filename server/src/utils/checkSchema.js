const { poolPromise } = require('../config/db');

async function checkTableSchema() {
  try {
    const pool = await poolPromise;
    
    // Query to get column information for MTIUsers table
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH 
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = 'MTIUsers'
    `);
    
    console.log('MTIUsers Table Schema:');
    console.table(result.recordset);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkTableSchema();