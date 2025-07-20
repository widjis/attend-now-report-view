const sql = require('mssql');

/**
 * Direct Database Inspection Script
 * Uses hardcoded configuration from .env file
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

async function inspectCardDBTimeSchedule() {
  try {
    console.log('🔍 Inspecting CardDBTimeSchedule table...');
    console.log('=' .repeat(50));
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');
    
    // Check if CardDBTimeSchedule table exists
    const tableExistsQuery = `
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CardDBTimeSchedule'
    `;
    
    const tableExistsResult = await pool.request().query(tableExistsQuery);
    const tableExists = tableExistsResult.recordset[0].table_exists > 0;
    
    if (!tableExists) {
      console.log('❌ CardDBTimeSchedule table does not exist');
      return;
    }
    
    console.log('✅ CardDBTimeSchedule table found');
    
    // Get table schema
    const schemaQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CardDBTimeSchedule'
      ORDER BY ORDINAL_POSITION
    `;
    
    const schemaResult = await pool.request().query(schemaQuery);
    console.log('\n📊 Table Schema:');
    schemaResult.recordset.forEach(col => {
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
    });
    
    // Get total record count
    const countQuery = 'SELECT COUNT(*) as total_records FROM CardDBTimeSchedule';
    const countResult = await pool.request().query(countQuery);
    const totalRecords = countResult.recordset[0].total_records;
    console.log(`\n📈 Total Records: ${totalRecords}`);
    
    // Get sample data
    const sampleQuery = 'SELECT TOP 5 * FROM CardDBTimeSchedule ORDER BY StaffNo';
    const sampleResult = await pool.request().query(sampleQuery);
    console.log('\n📝 Sample Data (first 5 records):');
    sampleResult.recordset.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      Object.entries(record).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    });
    
    // Get statistics about MTI staff
    const mtiStatsQuery = `
      SELECT 
        COUNT(*) as total_mti_records,
        COUNT(CASE WHEN TimeIn IS NOT NULL THEN 1 END) as records_with_timein,
        COUNT(CASE WHEN TimeOut IS NOT NULL THEN 1 END) as records_with_timeout,
        COUNT(DISTINCT Department) as unique_departments
      FROM CardDBTimeSchedule 
      WHERE StaffNo LIKE '%MTI%'
    `;
    
    const mtiStatsResult = await pool.request().query(mtiStatsQuery);
    const mtiStats = mtiStatsResult.recordset[0];
    console.log('\n📊 MTI Staff Statistics:');
    console.log(`   Total MTI Records: ${mtiStats.total_mti_records}`);
    console.log(`   Records with TimeIn: ${mtiStats.records_with_timein}`);
    console.log(`   Records with TimeOut: ${mtiStats.records_with_timeout}`);
    console.log(`   Unique Departments: ${mtiStats.unique_departments}`);
    
    // Get department breakdown
    const deptQuery = `
      SELECT 
        Department,
        COUNT(*) as record_count
      FROM CardDBTimeSchedule 
      WHERE StaffNo LIKE '%MTI%' AND Department IS NOT NULL
      GROUP BY Department
      ORDER BY record_count DESC
    `;
    
    const deptResult = await pool.request().query(deptQuery);
    console.log('\n🏢 Department Breakdown:');
    deptResult.recordset.forEach(dept => {
      console.log(`   ${dept.Department}: ${dept.record_count} records`);
    });
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Error inspecting CardDBTimeSchedule:', err.message);
  }
}

async function checkMTIUsersTable() {
  try {
    console.log('\n🔍 Checking for MTIUsers table...');
    console.log('=' .repeat(50));
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    // Check if MTIUsers table exists
    const tableExistsQuery = `
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'MTIUsers'
    `;
    
    const tableExistsResult = await pool.request().query(tableExistsQuery);
    const tableExists = tableExistsResult.recordset[0].table_exists > 0;
    
    if (tableExists) {
      console.log('✅ MTIUsers table already exists');
      
      // Get table schema
      const schemaQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'MTIUsers'
        ORDER BY ORDINAL_POSITION
      `;
      
      const schemaResult = await pool.request().query(schemaQuery);
      console.log('\n📊 MTIUsers Table Schema:');
      schemaResult.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
      });
      
      // Get record count
      const countQuery = 'SELECT COUNT(*) as total_records FROM MTIUsers';
      const countResult = await pool.request().query(countQuery);
      console.log(`\n📈 Total Records in MTIUsers: ${countResult.recordset[0].total_records}`);
      
    } else {
      console.log('❌ MTIUsers table does not exist');
      console.log('💡 This table needs to be created for the migration');
    }
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Error checking MTIUsers table:', err.message);
  }
}

async function createMTIUsersTable() {
  try {
    console.log('\n🔧 Creating MTIUsers table...');
    console.log('=' .repeat(50));
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    const createTableQuery = `
      CREATE TABLE MTIUsers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        employee_id NVARCHAR(50) NOT NULL,
        employee_name NVARCHAR(255) NOT NULL,
        gender NVARCHAR(10),
        division NVARCHAR(100),
        department NVARCHAR(100),
        section NVARCHAR(100),
        supervisor_id NVARCHAR(50),
        supervisor_name NVARCHAR(255),
        position_title NVARCHAR(255),
        grade_interval NVARCHAR(50),
        phone NVARCHAR(50),
        day_type NVARCHAR(50),
        description NVARCHAR(MAX),
        time_in TIME,
        time_out TIME,
        next_day BIT DEFAULT 0,
        CardNo NVARCHAR(50),
        AccessLevel INT,
        Name NVARCHAR(255),
        FirstName NVARCHAR(255),
        LastName NVARCHAR(255),
        StaffNo NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        INDEX IX_MTIUsers_employee_id (employee_id),
        INDEX IX_MTIUsers_department (department),
        INDEX IX_MTIUsers_division (division),
        INDEX IX_MTIUsers_section (section)
      )
    `;
    
    await pool.request().query(createTableQuery);
    console.log('✅ MTIUsers table created successfully');
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Error creating MTIUsers table:', err.message);
  }
}

async function main() {
  console.log('🚀 Starting Database Migration Analysis');
  console.log('Database: EmployeeWorkflow on 10.60.10.47');
  console.log('=' .repeat(60));
  
  // Step 1: Inspect current CardDBTimeSchedule table
  await inspectCardDBTimeSchedule();
  
  // Step 2: Check if MTIUsers table exists
  await checkMTIUsersTable();
  
  // Step 3: Offer to create MTIUsers table if it doesn't exist
  console.log('\n🎯 Migration Analysis Complete');
  console.log('=' .repeat(60));
  console.log('Next steps:');
  console.log('1. Review the CardDBTimeSchedule structure above');
  console.log('2. If MTIUsers table doesn\'t exist, run createMTIUsersTable()');
  console.log('3. Plan data migration from CardDBTimeSchedule to MTIUsers');
  console.log('4. Update frontend to use new MTIUsers structure');
}

// Run the analysis
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});