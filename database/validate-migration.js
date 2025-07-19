const sql = require('mssql');
require('dotenv').config({ path: '.env.migration' });

// Database configurations
const sourceConfig = {
  user: process.env.SOURCE_DB_USER || process.env.DB_USER,
  password: process.env.SOURCE_DB_PASSWORD || process.env.DB_PASSWORD,
  server: process.env.SOURCE_DB_SERVER || process.env.DB_SERVER,
  database: 'DataDBEnt',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: parseInt(process.env.SOURCE_DB_PORT || process.env.DB_PORT) || 1433
};

const targetConfig = {
  user: process.env.TARGET_DB_USER || process.env.DB_USER,
  password: process.env.TARGET_DB_PASSWORD || process.env.DB_PASSWORD,
  server: process.env.TARGET_DB_SERVER || process.env.DB_SERVER,
  database: 'EmployeeWorkflow',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: parseInt(process.env.TARGET_DB_PORT || process.env.DB_PORT) || 1433
};

class MigrationValidator {
  constructor() {
    this.sourcePool = null;
    this.targetPool = null;
  }

  async initialize() {
    try {
      console.log('🔗 Connecting to databases...');
      this.sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
      this.targetPool = await new sql.ConnectionPool(targetConfig).connect();
      console.log('✅ Connected to both databases');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async validateRecordCounts() {
    try {
      console.log('📊 Validating record counts...');

      // Get source counts
      const sourceResult = await this.sourcePool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM CardDBTimeSchedule) AS ScheduleCount,
          (SELECT COUNT(*) FROM tblAttendanceReport) AS AttendanceCount
      `);

      // Get target counts
      const targetResult = await this.targetPool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM CardDBTimeSchedule) AS ScheduleCount,
          (SELECT COUNT(*) FROM tblAttendanceReport) AS AttendanceCount
      `);

      const source = sourceResult.recordset[0];
      const target = targetResult.recordset[0];

      console.log('\n📋 Record Count Comparison:');
      console.log('┌─────────────────────┬────────────┬────────────┬──────────┐');
      console.log('│ Table               │ Source     │ Target     │ Status   │');
      console.log('├─────────────────────┼────────────┼────────────┼──────────┤');
      console.log(`│ CardDBTimeSchedule  │ ${source.ScheduleCount.toString().padEnd(10)} │ ${target.ScheduleCount.toString().padEnd(10)} │ ${source.ScheduleCount === target.ScheduleCount ? '✅ Match' : '❌ Diff'} │`);
      console.log(`│ tblAttendanceReport │ ${source.AttendanceCount.toString().padEnd(10)} │ ${target.AttendanceCount.toString().padEnd(10)} │ ${source.AttendanceCount === target.AttendanceCount ? '✅ Match' : '❌ Diff'} │`);
      console.log('└─────────────────────┴────────────┴────────────┴──────────┘\n');

      return {
        scheduleMatch: source.ScheduleCount === target.ScheduleCount,
        attendanceMatch: source.AttendanceCount === target.AttendanceCount,
        source,
        target
      };
    } catch (error) {
      console.error('❌ Record count validation failed:', error);
      throw error;
    }
  }

  async validateDataIntegrity() {
    try {
      console.log('🔍 Validating data integrity...');

      // Check for unique staff numbers in schedule
      const scheduleIntegrityResult = await this.targetPool.request().query(`
        SELECT 
          COUNT(*) AS TotalRecords,
          COUNT(DISTINCT StaffNo) AS UniqueStaffNumbers,
          COUNT(*) - COUNT(DISTINCT StaffNo) AS DuplicateCount
        FROM CardDBTimeSchedule
      `);

      const scheduleIntegrity = scheduleIntegrityResult.recordset[0];

      // Check attendance data integrity
      const attendanceIntegrityResult = await this.targetPool.request().query(`
        SELECT 
          COUNT(*) AS TotalRecords,
          COUNT(CASE WHEN ClockEvent = 'Clock In' THEN 1 END) AS ClockInCount,
          COUNT(CASE WHEN ClockEvent = 'Clock Out' THEN 1 END) AS ClockOutCount,
          COUNT(CASE WHEN ClockEvent = 'Outside Range' THEN 1 END) AS OutsideRangeCount,
          COUNT(DISTINCT StaffNo) AS UniqueStaffNumbers,
          MIN(TrDate) AS EarliestDate,
          MAX(TrDate) AS LatestDate
        FROM tblAttendanceReport
      `);

      const attendanceIntegrity = attendanceIntegrityResult.recordset[0];

      console.log('\n🔍 Data Integrity Report:');
      console.log('\n📋 Schedule Data:');
      console.log(`   Total Records: ${scheduleIntegrity.TotalRecords}`);
      console.log(`   Unique Staff Numbers: ${scheduleIntegrity.UniqueStaffNumbers}`);
      console.log(`   Duplicate Records: ${scheduleIntegrity.DuplicateCount} ${scheduleIntegrity.DuplicateCount === 0 ? '✅' : '⚠️'}`);

      console.log('\n📊 Attendance Data:');
      console.log(`   Total Records: ${attendanceIntegrity.TotalRecords}`);
      console.log(`   Clock In Events: ${attendanceIntegrity.ClockInCount}`);
      console.log(`   Clock Out Events: ${attendanceIntegrity.ClockOutCount}`);
      console.log(`   Outside Range Events: ${attendanceIntegrity.OutsideRangeCount}`);
      console.log(`   Unique Staff Numbers: ${attendanceIntegrity.UniqueStaffNumbers}`);
      console.log(`   Date Range: ${attendanceIntegrity.EarliestDate?.toISOString().split('T')[0]} to ${attendanceIntegrity.LatestDate?.toISOString().split('T')[0]}`);

      return {
        scheduleIntegrity,
        attendanceIntegrity
      };
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      throw error;
    }
  }

  async validateSampleData() {
    try {
      console.log('🔬 Validating sample data consistency...');

      // Get sample staff numbers from source
      const sampleStaffResult = await this.sourcePool.request().query(`
        SELECT TOP 5 StaffNo FROM CardDBTimeSchedule ORDER BY StaffNo
      `);

      const sampleStaff = sampleStaffResult.recordset.map(r => r.StaffNo);

      for (const staffNo of sampleStaff) {
        // Check schedule data consistency
        const sourceSchedule = await this.sourcePool.request()
          .input('StaffNo', sql.NVarChar(50), staffNo)
          .query('SELECT Name, Department, TimeIn, TimeOut FROM CardDBTimeSchedule WHERE StaffNo = @StaffNo');

        const targetSchedule = await this.targetPool.request()
          .input('StaffNo', sql.NVarChar(50), staffNo)
          .query('SELECT Name, Department, TimeIn, TimeOut FROM CardDBTimeSchedule WHERE StaffNo = @StaffNo');

        if (sourceSchedule.recordset.length > 0 && targetSchedule.recordset.length > 0) {
          const source = sourceSchedule.recordset[0];
          const target = targetSchedule.recordset[0];

          const isMatch = source.Name === target.Name && 
                         source.Department === target.Department &&
                         source.TimeIn.getTime() === target.TimeIn.getTime() &&
                         source.TimeOut.getTime() === target.TimeOut.getTime();

          console.log(`   ${staffNo}: ${isMatch ? '✅ Match' : '❌ Mismatch'}`);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Sample data validation failed:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.sourcePool) await this.sourcePool.close();
      if (this.targetPool) await this.targetPool.close();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async validate() {
    try {
      console.log('🚀 Starting migration validation...\n');

      await this.initialize();

      const countValidation = await this.validateRecordCounts();
      const integrityValidation = await this.validateDataIntegrity();
      await this.validateSampleData();

      console.log('\n🎯 Validation Summary:');
      console.log(`   Schedule Records: ${countValidation.scheduleMatch ? '✅ Passed' : '❌ Failed'}`);
      console.log(`   Attendance Records: ${countValidation.attendanceMatch ? '✅ Passed' : '❌ Failed'}`);
      console.log(`   Data Integrity: ${integrityValidation.scheduleIntegrity.DuplicateCount === 0 ? '✅ Passed' : '⚠️ Warning'}`);

      const overallSuccess = countValidation.scheduleMatch && countValidation.attendanceMatch;
      
      if (overallSuccess) {
        console.log('\n🎉 Migration validation completed successfully!');
      } else {
        console.log('\n⚠️ Migration validation completed with issues. Please review the results above.');
      }

      return overallSuccess;

    } catch (error) {
      console.error('💥 Validation failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  const validator = new MigrationValidator();
  
  try {
    const success = await validator.validate();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Validation process failed:', error);
    process.exit(1);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = MigrationValidator;