
require('dotenv').config();
const { sql } = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const TARGET_USER = 'widji.santoso';
const TARGET_PASSWORD = 'P@ssw0rd.123';
const TARGET_ROLE = 'admin'; // Assuming admin, or user? Let's default to admin for now as it seems to be a test user.
const AUTH_TYPE = 'local';

async function upsertUser() {
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

  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // 1. Check if user exists
    const checkQuery = "SELECT * FROM users WHERE username = @username";
    const checkResult = await pool.request()
      .input('username', sql.NVarChar, TARGET_USER)
      .query(checkQuery);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TARGET_PASSWORD, salt);

    if (checkResult.recordset.length > 0) {
      // Update existing user
      console.log(`User '${TARGET_USER}' exists. Updating password...`);
      const updateQuery = `
        UPDATE users 
        SET password = @password, 
            authentication_type = @authType,
            approved = 1
        WHERE username = @username
      `;
      
      await pool.request()
        .input('password', sql.NVarChar, hashedPassword)
        .input('authType', sql.VarChar, AUTH_TYPE)
        .input('username', sql.NVarChar, TARGET_USER)
        .query(updateQuery);
        
      console.log('✅ Password updated successfully.');
    } else {
      // Create new user
      console.log(`User '${TARGET_USER}' does not exist. Creating...`);
      const insertQuery = `
        INSERT INTO users (id, username, password, role, approved, authentication_type)
        VALUES (@id, @username, @password, @role, 1, @authType)
      `;
      
      const newId = uuidv4();
      
      await pool.request()
        .input('id', sql.NVarChar, newId)
        .input('username', sql.NVarChar, TARGET_USER)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.VarChar, TARGET_ROLE)
        .input('authType', sql.VarChar, AUTH_TYPE)
        .query(insertQuery);
        
      console.log(`✅ User created successfully with ID: ${newId}`);
    }

    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

upsertUser();
