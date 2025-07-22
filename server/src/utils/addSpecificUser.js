/**
 * Utility to create a specific user in the users table
 */
require('dotenv').config({ path: '../../.env' });
const sql = require('mssql');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function addSpecificUser() {
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

    // Check if user already exists
    console.log('Checking if user exists...');
    const userExistsQuery = `
      SELECT COUNT(*) as user_exists 
      FROM users 
      WHERE username = @username
    `;
    
    const userExistsResult = await pool.request()
      .input('username', sql.NVarChar, 'widji.santoso@merdeka')
      .query(userExistsQuery);
    
    const userExists = userExistsResult.recordset[0].user_exists > 0;
    
    if (userExists) {
      console.log('✅ User already exists');
      await pool.close();
      return { success: true, message: 'User already exists' };
    }
    
    // Create user
    console.log('Creating user...');
    
    // Hash password
    const password = 'P@ssw0rd.123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique ID
    const userId = uuidv4();
    
    // Insert user
    const createUserQuery = `
      INSERT INTO users (id, username, password, role, approved, authentication_type)
      VALUES (@id, @username, @password, @role, @approved, @authType)
    `;
    
    await pool.request()
      .input('id', sql.NVarChar, userId)
      .input('username', sql.NVarChar, 'widji.santoso@merdeka')
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, 'user')
      .input('approved', sql.Bit, 1)
      .input('authType', sql.VarChar, 'local')
      .query(createUserQuery);
    
    console.log('✅ User created successfully');
    console.log('Username: widji.santoso@merdeka');
    console.log('Password: P@ssw0rd.123');
    console.log('Role: user');

    // Close connection
    await pool.close();
    console.log('\nDatabase connection closed');
    
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

// Run the creation
addSpecificUser()
  .then(result => {
    console.log('\nOperation result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });