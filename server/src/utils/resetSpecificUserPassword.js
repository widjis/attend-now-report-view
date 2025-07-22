/**
 * Utility to reset or create a specific user password
 */
require('dotenv').config({ path: '../../.env' });
const sql = require('mssql');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function resetSpecificUserPassword() {
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

    // Define the username and password to reset/create
    const username = 'widji.santoso@merdekabattery.com';
    const password = 'P@ssw0rd.123';

    // Check if user exists
    console.log(`Checking if user ${username} exists...`);
    const userExistsQuery = `
      SELECT id, username, role, authentication_type 
      FROM users 
      WHERE username = @username
    `;
    
    const userExistsResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(userExistsQuery);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (userExistsResult.recordset.length === 0) {
      console.log(`❌ User ${username} does not exist, creating new user...`);
      
      // Generate a unique ID
      const userId = uuidv4();
      
      // Insert user
      const createUserQuery = `
        INSERT INTO users (id, username, password, role, approved, authentication_type)
        VALUES (@id, @username, @password, @role, @approved, @authType)
      `;
      
      await pool.request()
        .input('id', sql.NVarChar, userId)
        .input('username', sql.NVarChar, username)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'user')
        .input('approved', sql.Bit, 1)
        .input('authType', sql.VarChar, 'local')
        .query(createUserQuery);
      
      console.log(`✅ User ${username} created successfully`);
    } else {
      // User exists, reset password
      const user = userExistsResult.recordset[0];
      console.log(`Found user:`, user);
      
      // Update user password and authentication type
      console.log(`Resetting password for ${username} and setting authentication_type to 'local'...`);
      
      const updatePasswordQuery = `
        UPDATE users 
        SET password = @password, authentication_type = @authType
        WHERE id = @id
      `;
      
      await pool.request()
        .input('id', sql.NVarChar, user.id)
        .input('password', sql.NVarChar, hashedPassword)
        .input('authType', sql.VarChar, 'local')
        .query(updatePasswordQuery);
      
      console.log(`✅ Password for ${username} reset successfully`);
    }

    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);

    // Close connection
    await pool.close();
    console.log('\nDatabase connection closed');
    
    return { success: true, message: `Operation for ${username} completed successfully` };
  } catch (error) {
    console.error('Error during operation:', error);
    return { success: false, error: error.message };
  }
}

// Run the operation
resetSpecificUserPassword()
  .then(result => {
    console.log('\nOperation result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });