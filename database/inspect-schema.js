require('dotenv').config({ path: '.env.migration' });
const sql = require('mssql');

// Database configuration
const sourceConfig = {
  user: process.env.SOURCE_DB_USER || process.env.DB_USER,
  password: process.env.SOURCE_DB_PASSWORD || process.env.DB_PASSWORD,
  server: process.env.SOURCE_DB_SERVER || process.env.DB_SERVER,
  port: parseInt(process.env.SOURCE_DB_PORT || process.env.DB_PORT || '1433'),
  database: 'DataDBEnt',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

async function inspectSourceSchema() {
  let pool;
  
  try {
    console.log('🔍 Connecting to source database to inspect schema...');
    console.log(`📡 Server: ${sourceConfig.server}:${sourceConfig.port}`);
    console.log(`🗄️  Database: ${sourceConfig.database}`);
    
    pool = await sql.connect(sourceConfig);
    console.log('✅ Connected to source database successfully');

    // Get tblAttendanceReport schema
    console.log('\n📋 Inspecting tblAttendanceReport schema...');
    const attendanceSchemaQuery = `
      SELECT 
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.NUMERIC_PRECISION,
        c.NUMERIC_SCALE,
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT,
        c.ORDINAL_POSITION
      FROM INFORMATION_SCHEMA.COLUMNS c
      WHERE c.TABLE_NAME = 'tblAttendanceReport'
      ORDER BY c.ORDINAL_POSITION
    `;

    const attendanceResult = await pool.request().query(attendanceSchemaQuery);
    
    if (attendanceResult.recordset.length === 0) {
      console.log('❌ tblAttendanceReport table not found in source database');
    } else {
      console.log('\n📊 tblAttendanceReport Schema:');
      console.log('=====================================');
      attendanceResult.recordset.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const precision = col.NUMERIC_PRECISION && col.NUMERIC_SCALE ? `(${col.NUMERIC_PRECISION},${col.NUMERIC_SCALE})` : '';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        
        console.log(`${col.ORDINAL_POSITION.toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE}${length}${precision} ${nullable}${defaultVal}`);
      });
    }

    // Get CardDBTimeSchedule schema
    console.log('\n📋 Inspecting CardDBTimeSchedule schema...');
    const scheduleSchemaQuery = `
      SELECT 
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.NUMERIC_PRECISION,
        c.NUMERIC_SCALE,
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT,
        c.ORDINAL_POSITION
      FROM INFORMATION_SCHEMA.COLUMNS c
      WHERE c.TABLE_NAME = 'CardDBTimeSchedule'
      ORDER BY c.ORDINAL_POSITION
    `;

    const scheduleResult = await pool.request().query(scheduleSchemaQuery);
    
    if (scheduleResult.recordset.length === 0) {
      console.log('❌ CardDBTimeSchedule table not found in source database');
    } else {
      console.log('\n📊 CardDBTimeSchedule Schema:');
      console.log('=====================================');
      scheduleResult.recordset.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const precision = col.NUMERIC_PRECISION && col.NUMERIC_SCALE ? `(${col.NUMERIC_PRECISION},${col.NUMERIC_SCALE})` : '';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        
        console.log(`${col.ORDINAL_POSITION.toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE}${length}${precision} ${nullable}${defaultVal}`);
      });
    }

    // Get sample data from tblAttendanceReport
    console.log('\n📊 Sample data from tblAttendanceReport (first 5 records):');
    console.log('=========================================================');
    const sampleDataQuery = `
      SELECT TOP 5 *
      FROM tblAttendanceReport
      ORDER BY TrDate DESC
    `;

    const sampleResult = await pool.request().query(sampleDataQuery);
    if (sampleResult.recordset.length > 0) {
      console.log('Columns:', Object.keys(sampleResult.recordset[0]).join(', '));
      sampleResult.recordset.forEach((row, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('No data found in tblAttendanceReport');
    }

    // Get sample data from CardDBTimeSchedule
    console.log('\n📊 Sample data from CardDBTimeSchedule (first 5 records):');
    console.log('=========================================================');
    const scheduleSampleQuery = `
      SELECT TOP 5 *
      FROM CardDBTimeSchedule
      ORDER BY StaffNo
    `;

    const scheduleSampleResult = await pool.request().query(scheduleSampleQuery);
    if (scheduleSampleResult.recordset.length > 0) {
      console.log('Columns:', Object.keys(scheduleSampleResult.recordset[0]).join(', '));
      scheduleSampleResult.recordset.forEach((row, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('No data found in CardDBTimeSchedule');
    }

  } catch (error) {
    console.error('❌ Schema inspection failed:', error.message);
    if (error.code === 'ETIMEOUT') {
      console.log('\n💡 Connection timeout suggestions:');
      console.log('   1. Check if the database server is accessible');
      console.log('   2. Verify firewall settings for port 1433');
      console.log('   3. Ensure you\'re on the correct network/VPN');
      console.log('   4. Test connectivity: ping 10.60.10.47');
    }
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the inspection
inspectSourceSchema();