
require('dotenv').config();
const { sql } = require('../config/db');

async function debugUser() {
  // Use environment variables directly for connection
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

  const target = 'widji.santoso@merdekabattery.com';
  console.log(`\n🔍 Debugging user: '${target}'`);

  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // Check strict match on username
    let result = await pool.request()
      .input('target', sql.NVarChar, target)
      .query("SELECT * FROM users WHERE username = @target");
    
    if (result.recordset.length > 0) {
      console.log('\n✅ Found by USERNAME match:');
      console.log(result.recordset[0]);
    } else {
      console.log('\n❌ Not found by USERNAME match');
    }

    // Check strict match on email
    result = await pool.request()
      .input('target', sql.NVarChar, target)
      .query("SELECT * FROM users WHERE email = @target");
    
    if (result.recordset.length > 0) {
      console.log('\n✅ Found by EMAIL match:');
      console.log(result.recordset[0]);
    } else {
      console.log('\n❌ Not found by EMAIL match');
    }

    // Check LIKE match (to catch whitespace or casing issues)
    result = await pool.request()
      .input('target', sql.NVarChar, `%${target}%`)
      .query("SELECT * FROM users WHERE username LIKE @target OR email LIKE @target");
    
    if (result.recordset.length > 0) {
      console.log('\n⚠️ Found by LIKE search (possible whitespace/casing issue):');
      result.recordset.forEach(u => {
        console.log(`- ID: ${u.id}`);
        console.log(`  Username: '${u.username}'`);
        console.log(`  Email:    '${u.email}'`);
        console.log(`  Password: '${u.password ? u.password.substring(0, 15) + '...' : 'NULL'}'`);
      });
    } else {
      console.log('\n❌ Not found by LIKE search either');
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

debugUser();
