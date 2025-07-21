const { poolPromise, sql } = require('../config/db');

/**
 * Utility to inspect the users table in EmployeeWorkflow database
 * This script helps examine the current users table structure
 */

async function inspectUsersTable() {
  try {
    const pool = await poolPromise;
    
    console.log('=== USERS TABLE INSPECTION ===\n');
    
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
      console.log('\nUsers Table Schema:');
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
      console.table(schemaResult.recordset);
      
      // Get sample data (without exposing passwords)
      console.log('\nSample Data from users table (first 5 records, passwords hidden):');
      const sampleQuery = `
        SELECT TOP 5 
          id, 
          username, 
          email, 
          role, 
          CASE WHEN password IS NOT NULL THEN '********' ELSE NULL END as password_masked,
          created_at, 
          updated_at
        FROM users
      `;
      
      const sampleResult = await pool.request().query(sampleQuery);
      console.table(sampleResult.recordset);
      
      // Get data statistics
      console.log('\nData Statistics:');
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(DISTINCT username) as unique_usernames,
          COUNT(DISTINCT role) as role_count,
          COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_password
        FROM users
      `;
      
      const statsResult = await pool.request().query(statsQuery);
      console.table(statsResult.recordset);
      
      // Get roles distribution
      console.log('\nRoles Distribution:');
      const rolesQuery = `
        SELECT 
          role, 
          COUNT(*) as user_count
        FROM users
        GROUP BY role
        ORDER BY user_count DESC
      `;
      
      const rolesResult = await pool.request().query(rolesQuery);
      console.table(rolesResult.recordset);
      
      return {
        exists: true,
        schema: schemaResult.recordset,
        sample: sampleResult.recordset,
        stats: statsResult.recordset,
        roles: rolesResult.recordset
      };
    } else {
      console.log('❌ users table does not exist');
      
      // Suggest schema for users table
      console.log('\nSuggested Schema for users table:');
      console.log(`
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(50) NOT NULL UNIQUE,
          password NVARCHAR(100) NOT NULL,
          email NVARCHAR(100),
          role NVARCHAR(20) NOT NULL DEFAULT 'user',
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);
      
      return { exists: false };
    }
  } catch (error) {
    console.error('Error inspecting users table:', error);
    return { error: error.message };
  }
}

// Run the inspection if this file is executed directly
if (require.main === module) {
  inspectUsersTable()
    .then(() => {
      console.log('\nInspection complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Inspection failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = { inspectUsersTable };
}