/**
 * Utility to reset the admin password
 */
require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
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

    // Check if admin user exists
    console.log('Checking if admin user exists...');
    const userExistsQuery = `
      SELECT id, username, role, authentication_type 
      FROM users 
      WHERE username = @username
    `;
    
    const userExistsResult = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .query(userExistsQuery);
    
    if (userExistsResult.recordset.length === 0) {
      console.log('❌ Admin user does not exist');
      await pool.close();
      return { success: false, message: 'Admin user does not exist' };
    }
    
    const adminUser = userExistsResult.recordset[0];
    console.log('Found admin user:', adminUser);
    
    // Reset admin password
    console.log('Resetting admin password...');
    
    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update admin password
    const updatePasswordQuery = `
      UPDATE users 
      SET password = @password
      WHERE id = @id
    `;
    
    await pool.request()
      .input('id', sql.NVarChar, adminUser.id)
      .input('password', sql.NVarChar, hashedPassword)
      .query(updatePasswordQuery);
    
    console.log('✅ Admin password reset successfully');
    console.log('Username: admin');
    console.log('New password: admin123');

    // Close connection
    await pool.close();
    console.log('\nDatabase connection closed');
    
    return { success: true, message: 'Admin password reset successfully' };
  } catch (error) {
    console.error('Error resetting admin password:', error);
    return { success: false, error: error.message };
  }
}

// Run the reset
resetAdminPassword()
  .then(result => {
    console.log('\nOperation result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });