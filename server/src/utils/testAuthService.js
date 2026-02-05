
require('dotenv').config();
const authService = require('../services/authService');
const { sql } = require('../config/db');

async function testAuth() {
  // authService is already an instance
  const username = 'widji.santoso';
  const password = 'P@ssw0rd.123';

  console.log(`Testing login for ${username}...`);
  try {
    const result = await authService.login(username, password);
    console.log('Login Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Login SUCCESS!');
    } else {
      console.log('❌ Login FAILED.');
    }
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    // Close the pool if it was opened by authService (it uses the shared poolPromise)
    // We might need to manually close it here for the script to exit cleanly
    try {
        // Just a small delay to ensure logs are flushed
        setTimeout(() => process.exit(0), 1000);
    } catch (e) {
        process.exit(1);
    }
  }
}

testAuth();
