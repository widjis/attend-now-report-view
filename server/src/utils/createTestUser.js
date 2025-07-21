/**
 * Utility to create a test user in the users table
 */
require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcrypt');

async function createTestUser() {
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

    // Check if test user already exists
    console.log('Checking if test user exists...');
    const userExistsQuery = `
      SELECT COUNT(*) as user_exists 
      FROM users 
      WHERE username = @username
    `;
    
    const userExistsResult = await pool.request()
      .input('username', sql.NVarChar, 'testuser')
      .query(userExistsQuery);
    
    const userExists = userExistsResult.recordset[0].user_exists > 0;
    
    if (userExists) {
      console.log('✅ Test user already exists');
      await pool.close();
      return { success: true, message: 'Test user already exists' };
    }
    
    // Create test user
    console.log('Creating test user...');
    
    // Hash password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert test user
    const createUserQuery = `
      INSERT INTO users (id, username, password, role, approved, authentication_type)
      VALUES (@id, @username, @password, @role, @approved, @authType)
    `;
    
    await pool.request()
      .input('id', sql.NVarChar, 'test-user-id')
      .input('username', sql.NVarChar, 'testuser')
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, 'user')
      .input('approved', sql.Bit, 1)
      .input('authType', sql.VarChar, 'local')
      .query(createUserQuery);
    
    console.log('✅ Test user created successfully');
    console.log('Username: testuser');
    console.log('Password: password123');
    console.log('Role: user');
    
    // Create admin user if it doesn't exist
    console.log('\nChecking if admin user exists...');
    const adminExistsQuery = `
      SELECT COUNT(*) as user_exists 
      FROM users 
      WHERE username = @username
    `;
    
    const adminExistsResult = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .query(adminExistsQuery);
    
    const adminExists = adminExistsResult.recordset[0].user_exists > 0;
    
    if (adminExists) {
      console.log('✅ Admin user already exists');
    } else {
      console.log('Creating admin user...');
      
      // Hash password
      const adminPassword = 'admin123';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      
      // Insert admin user
      const createAdminQuery = `
        INSERT INTO users (id, username, password, role, approved, authentication_type)
        VALUES (@id, @username, @password, @role, @approved, @authType)
      `;
      
      await pool.request()
        .input('id', sql.NVarChar, 'admin-user-id')
        .input('username', sql.NVarChar, 'admin')
        .input('password', sql.NVarChar, hashedAdminPassword)
        .input('role', sql.NVarChar, 'admin')
        .input('approved', sql.Bit, 1)
        .input('authType', sql.VarChar, 'local')
        .query(createAdminQuery);
      
      console.log('✅ Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Role: admin');
    }

    // Close connection
    await pool.close();
    console.log('\nDatabase connection closed');
    
    return { success: true, message: 'Test users created successfully' };
  } catch (error) {
    console.error('Error creating test user:', error);
    return { success: false, error: error.message };
  }
}

// Run the creation
createTestUser()
  .then(result => {
    console.log('\nOperation result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });