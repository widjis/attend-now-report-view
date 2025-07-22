require('dotenv').config();
const sql = require('mssql');

async function checkActualSchema() {
  try {
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
    
    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    // Query to get column information for users table
    console.log('Querying users table schema...');
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = 'users'
      ORDER BY
        ORDINAL_POSITION
    `);
    
    console.log('\nUsers Table Actual Schema:');
    console.table(result.recordset);
    
    // Close connection
    await pool.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Run the function
checkActualSchema();