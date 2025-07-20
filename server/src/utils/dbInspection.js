const { poolPromise } = require('../config/db');

/**
 * Database inspection utility for migration planning
 * This script helps examine the current CardDBTimeSchedule table structure
 * and plan the migration to the new MTIUsers table
 */

async function inspectCurrentTable() {
  try {
    const pool = await poolPromise;
    
    console.log('=== CURRENT TABLE INSPECTION ===\n');
    
    // 1. Get table schema for CardDBTimeSchedule
    console.log('1. CardDBTimeSchedule Table Schema:');
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
    console.table(schemaResult.recordset);
    
    // 2. Get sample data from CardDBTimeSchedule
    console.log('\n2. Sample Data from CardDBTimeSchedule (first 5 records):');
    const sampleQuery = `
      SELECT TOP 5 * 
      FROM CardDBTimeSchedule 
      WHERE StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'
    `;
    
    const sampleResult = await pool.request().query(sampleQuery);
    console.table(sampleResult.recordset);
    
    // 3. Get data statistics
    console.log('\n3. Data Statistics:');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT StaffNo) as unique_staff,
        COUNT(CASE WHEN TimeIn IS NOT NULL THEN 1 END) as records_with_timein,
        COUNT(CASE WHEN TimeOut IS NOT NULL THEN 1 END) as records_with_timeout,
        COUNT(CASE WHEN Department IS NOT NULL THEN 1 END) as records_with_department,
        COUNT(CASE WHEN Email IS NOT NULL THEN 1 END) as records_with_email
      FROM CardDBTimeSchedule 
      WHERE StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'
    `;
    
    const statsResult = await pool.request().query(statsQuery);
    console.table(statsResult.recordset);
    
    // 4. Get unique departments
    console.log('\n4. Unique Departments:');
    const deptQuery = `
      SELECT DISTINCT Department, COUNT(*) as count
      FROM CardDBTimeSchedule 
      WHERE StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'
        AND Department IS NOT NULL
      GROUP BY Department
      ORDER BY count DESC
    `;
    
    const deptResult = await pool.request().query(deptQuery);
    console.table(deptResult.recordset);
    
    // 5. Check if MTIUsers table exists
    console.log('\n5. Checking MTIUsers Table:');
    const tableExistsQuery = `
      SELECT COUNT(*) as table_exists
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'MTIUsers'
    `;
    
    const tableExistsResult = await pool.request().query(tableExistsQuery);
    const tableExists = tableExistsResult.recordset[0].table_exists > 0;
    
    if (tableExists) {
      console.log('✅ MTIUsers table exists');
      
      // Get MTIUsers schema
      console.log('\n6. MTIUsers Table Schema:');
      const mtiSchemaQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'MTIUsers'
        ORDER BY ORDINAL_POSITION
      `;
      
      const mtiSchemaResult = await pool.request().query(mtiSchemaQuery);
      console.table(mtiSchemaResult.recordset);
      
      // Get sample data from MTIUsers
      console.log('\n7. Sample Data from MTIUsers (first 5 records):');
      const mtiSampleQuery = `SELECT TOP 5 * FROM MTIUsers`;
      
      const mtiSampleResult = await pool.request().query(mtiSampleQuery);
      console.table(mtiSampleResult.recordset);
      
      // Get MTIUsers statistics
      console.log('\n8. MTIUsers Statistics:');
      const mtiStatsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT employee_id) as unique_employees,
          COUNT(CASE WHEN time_in IS NOT NULL THEN 1 END) as records_with_timein,
          COUNT(CASE WHEN time_out IS NOT NULL THEN 1 END) as records_with_timeout,
          COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as records_with_department,
          COUNT(CASE WHEN division IS NOT NULL THEN 1 END) as records_with_division,
          COUNT(CASE WHEN section IS NOT NULL THEN 1 END) as records_with_section
        FROM MTIUsers
      `;
      
      const mtiStatsResult = await pool.request().query(mtiStatsQuery);
      console.table(mtiStatsResult.recordset);
      
    } else {
      console.log('❌ MTIUsers table does not exist yet');
      console.log('📝 You will need to create this table first');
    }
    
    console.log('\n=== MIGRATION PLANNING SUMMARY ===');
    console.log('Current CardDBTimeSchedule fields used:');
    console.log('- StaffNo → employee_id (or StaffNo in MTIUsers)');
    console.log('- Name → employee_name (or Name in MTIUsers)');
    console.log('- TimeIn → time_in');
    console.log('- TimeOut → time_out');
    console.log('- Department → department');
    console.log('- Email → (not in MTIUsers schema, might need to add or use different field)');
    
    console.log('\nNew fields available in MTIUsers:');
    console.log('- employee_id, employee_name, gender, division, department, section');
    console.log('- supervisor_id, supervisor_name, position_title, grade_interval');
    console.log('- phone, day_type, description, time_in, time_out, next_day');
    console.log('- CardNo, AccessLevel, Name, FirstName, LastName, StaffNo');
    
  } catch (error) {
    console.error('Error inspecting database:', error);
  }
}

// Function to create MTIUsers table if it doesn't exist
async function createMTIUsersTable() {
  try {
    const pool = await poolPromise;
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MTIUsers' AND xtype='U')
      CREATE TABLE MTIUsers (
        employee_id     nvarchar(50)   NOT NULL,
        employee_name   nvarchar(100)  NULL,
        gender          nvarchar(10)   NULL,
        division        nvarchar(50)   NULL,
        department      nvarchar(50)   NULL,
        section         nvarchar(50)   NULL,
        supervisor_id   nvarchar(50)   NULL,
        supervisor_name nvarchar(100)  NULL,
        position_title  nvarchar(100)  NULL,
        grade_interval  nvarchar(50)   NULL,
        phone           nvarchar(20)   NULL,
        day_type        nvarchar(50)   NULL,
        description     nvarchar(200)  NULL,
        time_in         time(7)        NULL,
        time_out        time(7)        NULL,
        next_day        nvarchar(1)    NULL,
        CardNo          nvarchar(50)   NULL,
        AccessLevel     nvarchar(50)   NULL,
        Name            nvarchar(100)  NULL,
        FirstName       nvarchar(50)   NULL,
        LastName        nvarchar(50)   NULL,
        StaffNo         nvarchar(50)   NULL,
        
        CONSTRAINT PK_MTIUsers PRIMARY KEY (employee_id)
      )
    `;
    
    await pool.request().query(createTableQuery);
    console.log('✅ MTIUsers table created successfully');
    
  } catch (error) {
    console.error('Error creating MTIUsers table:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  inspectCurrentTable,
  createMTIUsersTable
};

// Run inspection if this file is executed directly
if (require.main === module) {
  inspectCurrentTable()
    .then(() => {
      console.log('\n🔍 Database inspection completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database inspection failed:', error);
      process.exit(1);
    });
}