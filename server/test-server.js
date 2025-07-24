require('dotenv').config();
const { poolPromise } = require('./src/config/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const pool = await poolPromise;
    console.log('✅ Database connection successful');
    
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✅ Database query successful:', result.recordset);
    
    console.log('🚀 Starting server...');
    require('./src/server.js');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();