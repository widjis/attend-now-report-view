// Load environment variables first
require('dotenv').config({ path: '.env.migration' });

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Database configurations
const sourceConfig = {
  user: process.env.SOURCE_DB_USER || process.env.DB_USER,
  password: process.env.SOURCE_DB_PASSWORD || process.env.DB_PASSWORD,
  server: process.env.SOURCE_DB_SERVER || process.env.DB_SERVER,
  database: 'DataDBEnt', // Source database
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: parseInt(process.env.SOURCE_DB_PORT || process.env.DB_PORT) || 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const targetConfig = {
  user: process.env.TARGET_DB_USER || process.env.DB_USER,
  password: process.env.TARGET_DB_PASSWORD || process.env.DB_PASSWORD,
  server: process.env.TARGET_DB_SERVER || process.env.DB_SERVER,
  database: 'EmployeeWorkflow', // Target database
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: parseInt(process.env.TARGET_DB_PORT || process.env.DB_PORT) || 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

class DatabaseMigrator {
  constructor() {
    this.sourcePool = null;
    this.targetPool = null;
    this.migrationLog = [];
  }

  // Initialize database connections
  async initialize() {
    try {
      console.log('🔗 Connecting to source database (DataDBEnt)...');
      this.sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
      console.log('✅ Connected to source database');

      console.log('🔗 Connecting to target database (EmployeeWorkflow)...');
      this.targetPool = await new sql.ConnectionPool(targetConfig).connect();
      console.log('✅ Connected to target database');

      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // Create target database schema if it doesn't exist
  async createTargetSchema() {
    try {
      console.log('🏗️  Creating target database schema...');
      
      const createTablesSQL = `
        -- Create CardDBTimeSchedule table if not exists
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CardDBTimeSchedule' AND xtype='U')
        BEGIN
          CREATE TABLE CardDBTimeSchedule (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            StaffNo NVARCHAR(50) NOT NULL,
            Name NVARCHAR(200) NOT NULL,
            Department NVARCHAR(100),
            TimeIn TIME NOT NULL,
            TimeOut TIME NOT NULL,
            IsActive BIT DEFAULT 1,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE()
          );
          
          CREATE UNIQUE INDEX IX_CardDBTimeSchedule_StaffNo ON CardDBTimeSchedule(StaffNo);
          CREATE INDEX IX_CardDBTimeSchedule_Department ON CardDBTimeSchedule(Department);
          CREATE INDEX IX_CardDBTimeSchedule_Name ON CardDBTimeSchedule(Name);
          
          PRINT 'CardDBTimeSchedule table created successfully';
        END
        ELSE
        BEGIN
          PRINT 'CardDBTimeSchedule table already exists';
        END

        -- Create tblAttendanceReport table if not exists
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblAttendanceReport' AND xtype='U')
        BEGIN
          CREATE TABLE tblAttendanceReport (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            StaffNo NVARCHAR(50) NOT NULL,
            TrDate DATE NOT NULL,
            TrDateTime DATETIME NOT NULL,
            ClockEvent NVARCHAR(20) NOT NULL CHECK (ClockEvent IN ('Clock In', 'Clock Out', 'Outside Range')),
            TrController NVARCHAR(100),
            Position NVARCHAR(100),
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE()
          );
          
          CREATE INDEX IX_tblAttendanceReport_StaffNo ON tblAttendanceReport(StaffNo);
          CREATE INDEX IX_tblAttendanceReport_TrDate ON tblAttendanceReport(TrDate);
          CREATE INDEX IX_tblAttendanceReport_TrDateTime ON tblAttendanceReport(TrDateTime);
          CREATE INDEX IX_tblAttendanceReport_ClockEvent ON tblAttendanceReport(ClockEvent);
          CREATE INDEX IX_tblAttendanceReport_StaffNo_TrDate ON tblAttendanceReport(StaffNo, TrDate);
          
          PRINT 'tblAttendanceReport table created successfully';
        END
        ELSE
        BEGIN
          PRINT 'tblAttendanceReport table already exists';
        END
      `;

      await this.targetPool.request().query(createTablesSQL);
      console.log('✅ Target schema created successfully');
      
      this.logMigration('SCHEMA_CREATION', 'Target database schema created successfully');
    } catch (error) {
      console.error('❌ Schema creation failed:', error);
      throw error;
    }
  }

  // Check if source tables exist
  async validateSourceTables() {
    try {
      console.log('🔍 Validating source tables...');
      
      const checkTablesSQL = `
        SELECT 
          CASE WHEN EXISTS (SELECT * FROM sysobjects WHERE name='CardDBTimeSchedule' AND xtype='U') 
               THEN 1 ELSE 0 END AS CardDBTimeScheduleExists,
          CASE WHEN EXISTS (SELECT * FROM sysobjects WHERE name='tblAttendanceReport' AND xtype='U') 
               THEN 1 ELSE 0 END AS tblAttendanceReportExists
      `;

      const result = await this.sourcePool.request().query(checkTablesSQL);
      const tables = result.recordset[0];

      if (!tables.CardDBTimeScheduleExists) {
        throw new Error('CardDBTimeSchedule table not found in source database');
      }
      if (!tables.tblAttendanceReportExists) {
        throw new Error('tblAttendanceReport table not found in source database');
      }

      console.log('✅ Source tables validation passed');
      return true;
    } catch (error) {
      console.error('❌ Source table validation failed:', error);
      throw error;
    }
  }

  // Get record counts from source tables
  async getSourceCounts() {
    try {
      const countSQL = `
        SELECT 
          (SELECT COUNT(*) FROM CardDBTimeSchedule) AS ScheduleCount,
          (SELECT COUNT(*) FROM tblAttendanceReport) AS AttendanceCount
      `;

      const result = await this.sourcePool.request().query(countSQL);
      return result.recordset[0];
    } catch (error) {
      console.error('❌ Failed to get source counts:', error);
      throw error;
    }
  }

  // Migrate CardDBTimeSchedule data
  async migrateScheduleData() {
    try {
      console.log('📋 Migrating CardDBTimeSchedule data...');

      // Clear existing data in target
      await this.targetPool.request().query('DELETE FROM CardDBTimeSchedule');
      console.log('🗑️  Cleared existing schedule data in target');

      // Get data from source - filter out records with NULL TimeIn or TimeOut
      const sourceData = await this.sourcePool.request().query(`
        SELECT StaffNo, Name, Department, TimeIn, TimeOut
        FROM CardDBTimeSchedule
        WHERE StaffNo IS NOT NULL AND StaffNo <> ''
          AND TimeIn IS NOT NULL 
          AND TimeOut IS NOT NULL
        ORDER BY StaffNo
      `);

      if (sourceData.recordset.length === 0) {
        console.log('⚠️  No valid schedule data found in source database (records with NULL TimeIn/TimeOut were filtered out)');
        return 0;
      }

      console.log(`📊 Found ${sourceData.recordset.length} valid schedule records (records with NULL TimeIn/TimeOut were filtered out)`);

      // Insert data into target
      let insertedCount = 0;
      let skippedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < sourceData.recordset.length; i += batchSize) {
        const batch = sourceData.recordset.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            // Double-check for NULL values before insertion
            if (!record.TimeIn || !record.TimeOut) {
              console.log(`⚠️  Skipping record for ${record.StaffNo} - NULL TimeIn or TimeOut`);
              skippedCount++;
              continue;
            }

            await this.targetPool.request()
              .input('StaffNo', sql.NVarChar(50), record.StaffNo)
              .input('Name', sql.NVarChar(200), record.Name || '')
              .input('Department', sql.NVarChar(100), record.Department || '')
              .input('TimeIn', sql.Time, record.TimeIn)
              .input('TimeOut', sql.Time, record.TimeOut)
              .query(`
                INSERT INTO CardDBTimeSchedule (StaffNo, Name, Department, TimeIn, TimeOut)
                VALUES (@StaffNo, @Name, @Department, @TimeIn, @TimeOut)
              `);
            insertedCount++;
          } catch (error) {
            console.error(`❌ Failed to insert schedule record for ${record.StaffNo}:`, error.message);
            skippedCount++;
          }
        }
        
        console.log(`📊 Processed ${Math.min(i + batchSize, sourceData.recordset.length)} / ${sourceData.recordset.length} schedule records`);
      }

      console.log(`✅ Schedule migration completed: ${insertedCount} records migrated, ${skippedCount} records skipped`);
      this.logMigration('SCHEDULE_MIGRATION', `${insertedCount} schedule records migrated successfully, ${skippedCount} records skipped due to NULL values`);
      
      return insertedCount;
    } catch (error) {
      console.error('❌ Schedule migration failed:', error);
      throw error;
    }
  }

  // Migrate tblAttendanceReport data
  async migrateAttendanceData() {
    try {
      console.log('📊 Migrating tblAttendanceReport data...');

      // Clear existing data in target
      await this.targetPool.request().query('DELETE FROM tblAttendanceReport');
      console.log('🗑️  Cleared existing attendance data in target');

      // Get data from source
      const sourceData = await this.sourcePool.request().query(`
        SELECT StaffNo, TrDate, TrDateTime, ClockEvent, TrController, Position
        FROM tblAttendanceReport
        WHERE StaffNo IS NOT NULL AND StaffNo <> ''
        ORDER BY TrDate DESC, StaffNo
      `);

      if (sourceData.recordset.length === 0) {
        console.log('⚠️  No attendance data found in source database');
        return 0;
      }

      // Insert data into target
      let insertedCount = 0;
      const batchSize = 500;
      
      for (let i = 0; i < sourceData.recordset.length; i += batchSize) {
        const batch = sourceData.recordset.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            await this.targetPool.request()
              .input('StaffNo', sql.NVarChar(50), record.StaffNo)
              .input('TrDate', sql.Date, record.TrDate)
              .input('TrDateTime', sql.DateTime, record.TrDateTime)
              .input('ClockEvent', sql.NVarChar(20), record.ClockEvent)
              .input('TrController', sql.NVarChar(100), record.TrController)
              .input('Position', sql.NVarChar(100), record.Position)
              .query(`
                INSERT INTO tblAttendanceReport (StaffNo, TrDate, TrDateTime, ClockEvent, TrController, Position)
                VALUES (@StaffNo, @TrDate, @TrDateTime, @ClockEvent, @TrController, @Position)
              `);
            insertedCount++;
          } catch (error) {
            console.error(`❌ Failed to insert attendance record for ${record.StaffNo} on ${record.TrDate}:`, error.message);
          }
        }
        
        console.log(`📊 Processed ${Math.min(i + batchSize, sourceData.recordset.length)} / ${sourceData.recordset.length} attendance records`);
      }

      console.log(`✅ Attendance migration completed: ${insertedCount} records migrated`);
      this.logMigration('ATTENDANCE_MIGRATION', `${insertedCount} attendance records migrated successfully`);
      
      return insertedCount;
    } catch (error) {
      console.error('❌ Attendance migration failed:', error);
      throw error;
    }
  }

  // Validate migrated data
  async validateMigration() {
    try {
      console.log('🔍 Validating migrated data...');

      const sourceCounts = await this.getSourceCounts();
      
      const targetCountSQL = `
        SELECT 
          (SELECT COUNT(*) FROM CardDBTimeSchedule) AS ScheduleCount,
          (SELECT COUNT(*) FROM tblAttendanceReport) AS AttendanceCount
      `;

      const targetResult = await this.targetPool.request().query(targetCountSQL);
      const targetCounts = targetResult.recordset[0];

      console.log('📊 Migration Summary:');
      console.log(`   Schedule Records - Source: ${sourceCounts.ScheduleCount}, Target: ${targetCounts.ScheduleCount}`);
      console.log(`   Attendance Records - Source: ${sourceCounts.AttendanceCount}, Target: ${targetCounts.AttendanceCount}`);

      const scheduleMatch = sourceCounts.ScheduleCount === targetCounts.ScheduleCount;
      const attendanceMatch = sourceCounts.AttendanceCount === targetCounts.AttendanceCount;

      if (scheduleMatch && attendanceMatch) {
        console.log('✅ Data validation passed - All records migrated successfully');
        this.logMigration('VALIDATION', 'Data validation passed - All records migrated successfully');
        return true;
      } else {
        console.log('⚠️  Data validation warning - Record counts do not match');
        this.logMigration('VALIDATION_WARNING', 'Record counts do not match between source and target');
        return false;
      }
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      throw error;
    }
  }

  // Log migration activities
  logMigration(action, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      message
    };
    this.migrationLog.push(logEntry);
    console.log(`📝 ${logEntry.timestamp} - ${action}: ${message}`);
  }

  // Save migration log to file
  async saveMigrationLog() {
    try {
      const logDir = path.join(__dirname, '..', '..', 'database', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `migration_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(logFile, JSON.stringify(this.migrationLog, null, 2));
      
      console.log(`📄 Migration log saved to: ${logFile}`);
    } catch (error) {
      console.error('❌ Failed to save migration log:', error);
    }
  }

  // Close database connections
  async cleanup() {
    try {
      if (this.sourcePool) {
        await this.sourcePool.close();
        console.log('🔌 Source database connection closed');
      }
      if (this.targetPool) {
        await this.targetPool.close();
        console.log('🔌 Target database connection closed');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Main migration process
  async migrate() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting database migration from DataDBEnt to EmployeeWorkflow...');
      this.logMigration('MIGRATION_START', 'Database migration started');

      // Initialize connections
      await this.initialize();

      // Validate source tables
      await this.validateSourceTables();

      // Create target schema
      await this.createTargetSchema();

      // Get source counts
      const sourceCounts = await this.getSourceCounts();
      console.log(`📊 Source data counts - Schedule: ${sourceCounts.ScheduleCount}, Attendance: ${sourceCounts.AttendanceCount}`);

      // Migrate data
      const scheduleCount = await this.migrateScheduleData();
      const attendanceCount = await this.migrateAttendanceData();

      // Validate migration
      await this.validateMigration();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log('🎉 Migration completed successfully!');
      console.log(`⏱️  Total time: ${duration} seconds`);
      console.log(`📊 Total records migrated: ${scheduleCount + attendanceCount}`);
      
      this.logMigration('MIGRATION_COMPLETE', `Migration completed successfully in ${duration} seconds. Total records: ${scheduleCount + attendanceCount}`);

      // Save migration log
      await this.saveMigrationLog();

    } catch (error) {
      console.error('💥 Migration failed:', error);
      this.logMigration('MIGRATION_ERROR', `Migration failed: ${error.message}`);
      await this.saveMigrationLog();
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseMigrator();
  
  try {
    await migrator.migrate();
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;