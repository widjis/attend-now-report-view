/**
 * Simple script to check if users table exists
 */
require('dotenv').config();
const sql = require('mssql');

async function checkUsersTable() {
  // Database configuration directly from environment variables
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: true
    },
    port: parseInt(process.env.DB_PORT) || 1433
  };

  console.log('Database config:', {
    user: config.user,
    server: config.server,
    database: config.database,
    port: config.port
  });

  try {
    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');

    // Check if users table exists
    console.log('Checking if users table exists...');
    const tableExistsQuery = `
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'users'
    `;
    
    const tableExistsResult = await pool.request().query(tableExistsQuery);
    const tableExists = tableExistsResult.recordset[0].table_exists > 0;
    
    if (tableExists) {
      console.log('✅ users table exists');
      
      // Get table schema
      console.log('\nRetrieving table schema...');
      const schemaQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          CHARACTER_MAXIMUM_LENGTH, 
          IS_NULLABLE, 
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users'
        ORDER BY ORDINAL_POSITION
      `;
      
      const schemaResult = await pool.request().query(schemaQuery);
      console.log('\nTable Schema:');
      console.table(schemaResult.recordset);
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as total_users FROM users`;
      const countResult = await pool.request().query(countQuery);
      console.log(`\nTotal users: ${countResult.recordset[0].total_users}`);
    } else {
      console.log('❌ users table does not exist');
    }

    // Close connection
    await pool.close();
    console.log('Database connection closed');
    
    return { success: true, tableExists };
  } catch (error) {
    console.error('Error checking users table:', error);
    return { success: false, error: error.message };
  }
}

// Run the check
checkUsersTable()
  .then(result => {
    console.log('\nOperation result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });