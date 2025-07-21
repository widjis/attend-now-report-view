const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

/**
 * Utility to create the users table in EmployeeWorkflow database
 */

async function createUsersTable() {
  try {
    const pool = await poolPromise;
    
    console.log('=== CREATING USERS TABLE ===\n');
    
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
      console.log('✅ users table already exists');
      return { success: true, message: 'Table already exists' };
    }
    
    // Create users table
    console.log('Creating users table...');
    const createTableQuery = `
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        email NVARCHAR(100),
        role NVARCHAR(20) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `;
    
    await pool.request().query(createTableQuery);
    console.log('✅ users table created successfully');
    
    // Create admin user
    console.log('\nCreating admin user...');
    // Hash the default password with bcrypt
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    
    const createAdminQuery = `
      INSERT INTO users (username, password, email, role)
      VALUES ('admin', @password, 'admin@example.com', 'admin')
    `;
    
    await pool.request()
      .input('password', sql.NVarChar, hashedPassword)
      .query(createAdminQuery);
    console.log('✅ admin user created successfully');
    
    return { success: true, message: 'Table and admin user created successfully' };
  } catch (error) {
    console.error('Error creating users table:', error);
    return { success: false, error: error.message };
  }
}

// Run the creation if this file is executed directly
if (require.main === module) {
  createUsersTable()
    .then(result => {
      console.log('\nOperation result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Operation failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = { createUsersTable };
}