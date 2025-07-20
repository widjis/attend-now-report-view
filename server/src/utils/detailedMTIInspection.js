const sql = require('mssql');

/**
 * Detailed MTIUsers Data Inspection
 * Check actual data values and identify issues with time_in/time_out
 */

// Database configuration from .env file
const config = {
  user: 'sa',
  password: 'Bl4ck3y34dmin',
  server: '10.60.10.47',
  database: 'EmployeeWorkflow',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: 1433
};

async function inspectMTIUsersData() {
  try {
    console.log('🔍 Detailed MTIUsers Data Inspection...');
    console.log('=' .repeat(60));
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');
    
    // Get sample data with all fields
    const sampleQuery = `
      SELECT TOP 10 
        employee_id,
        employee_name,
        department,
        division,
        section,
        time_in,
        time_out,
        description,
        day_type,
        position_title,
        supervisor_name,
        phone,
        StaffNo,
        Name,
        CardNo
      FROM MTIUsers 
      WHERE employee_id IS NOT NULL 
      ORDER BY employee_id
    `;
    
    const sampleResult = await pool.request().query(sampleQuery);
    console.log('\n📝 Sample Data (first 10 records):');
    console.log('=' .repeat(60));
    
    sampleResult.recordset.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`   Employee ID: ${record.employee_id}`);
      console.log(`   Employee Name: ${record.employee_name}`);
      console.log(`   Department: ${record.department}`);
      console.log(`   Division: ${record.division}`);
      console.log(`   Section: ${record.section}`);
      console.log(`   Time In: ${record.time_in}`);
      console.log(`   Time Out: ${record.time_out}`);
      console.log(`   Description: ${record.description}`);
      console.log(`   Day Type: ${record.day_type}`);
      console.log(`   Position: ${record.position_title}`);
      console.log(`   Supervisor: ${record.supervisor_name}`);
      console.log(`   Phone: ${record.phone}`);
      console.log(`   Staff No: ${record.StaffNo}`);
      console.log(`   Name: ${record.Name}`);
      console.log(`   Card No: ${record.CardNo}`);
    });
    
    // Check time_in/time_out statistics
    const timeStatsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(time_in) as records_with_time_in,
        COUNT(time_out) as records_with_time_out,
        COUNT(CASE WHEN time_in IS NOT NULL AND time_out IS NOT NULL THEN 1 END) as records_with_both_times,
        COUNT(CASE WHEN time_in IS NULL AND time_out IS NULL THEN 1 END) as records_with_no_times
      FROM MTIUsers
    `;
    
    const timeStatsResult = await pool.request().query(timeStatsQuery);
    const timeStats = timeStatsResult.recordset[0];
    
    console.log('\n⏰ Time Data Statistics:');
    console.log('=' .repeat(60));
    console.log(`   Total Records: ${timeStats.total_records}`);
    console.log(`   Records with Time In: ${timeStats.records_with_time_in}`);
    console.log(`   Records with Time Out: ${timeStats.records_with_time_out}`);
    console.log(`   Records with Both Times: ${timeStats.records_with_both_times}`);
    console.log(`   Records with No Times: ${timeStats.records_with_no_times}`);
    
    // Find records that DO have time data
    const recordsWithTimeQuery = `
      SELECT TOP 5
        employee_id,
        employee_name,
        time_in,
        time_out,
        department
      FROM MTIUsers 
      WHERE time_in IS NOT NULL OR time_out IS NOT NULL
      ORDER BY employee_id
    `;
    
    const recordsWithTimeResult = await pool.request().query(recordsWithTimeQuery);
    
    if (recordsWithTimeResult.recordset.length > 0) {
      console.log('\n✅ Records WITH Time Data:');
      console.log('=' .repeat(60));
      recordsWithTimeResult.recordset.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.employee_name} (${record.employee_id})`);
        console.log(`      Time In: ${record.time_in}`);
        console.log(`      Time Out: ${record.time_out}`);
        console.log(`      Department: ${record.department}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No records found with time data!');
    }
    
    // Check data types and constraints
    const schemaQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MTIUsers' 
        AND COLUMN_NAME IN ('time_in', 'time_out', 'employee_id', 'employee_name')
      ORDER BY ORDINAL_POSITION
    `;
    
    const schemaResult = await pool.request().query(schemaQuery);
    console.log('\n🏗️ Relevant Column Schema:');
    console.log('=' .repeat(60));
    schemaResult.recordset.forEach(col => {
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
    });
    
    // Check if there's data in CardDBTimeSchedule that we should migrate
    console.log('\n🔄 Checking CardDBTimeSchedule for comparison...');
    console.log('=' .repeat(60));
    
    const cardDbSampleQuery = `
      SELECT TOP 5
        StaffNo,
        Name,
        TimeIn,
        TimeOut,
        Department
      FROM CardDBTimeSchedule 
      WHERE StaffNo LIKE '%MTI%'
      ORDER BY StaffNo
    `;
    
    const cardDbSampleResult = await pool.request().query(cardDbSampleQuery);
    console.log('\n📋 CardDBTimeSchedule Sample (for comparison):');
    cardDbSampleResult.recordset.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.Name} (${record.StaffNo})`);
      console.log(`      Time In: ${record.TimeIn}`);
      console.log(`      Time Out: ${record.TimeOut}`);
      console.log(`      Department: ${record.Department}`);
      console.log('');
    });
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Error inspecting MTIUsers data:', err.message);
  }
}

async function main() {
  console.log('🚀 Starting Detailed MTIUsers Data Analysis');
  console.log('Database: EmployeeWorkflow on 10.60.10.47');
  console.log('=' .repeat(60));
  
  await inspectMTIUsersData();
  
  console.log('\n🎯 Analysis Complete');
  console.log('=' .repeat(60));
  console.log('💡 Key Questions to Answer:');
  console.log('1. Are time_in/time_out fields actually populated?');
  console.log('2. Do we need to migrate data from CardDBTimeSchedule?');
  console.log('3. What is the data format for time fields?');
}

// Run the analysis
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});