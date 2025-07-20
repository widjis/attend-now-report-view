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
      
      // First, create tables if they don't exist
      const createTablesSQL = `
        -- Create CardDBTimeSchedule table if not exists
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CardDBTimeSchedule' AND xtype='U')
        BEGIN
          CREATE TABLE CardDBTimeSchedule (
            ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
            CardNo VARCHAR(16) NOT NULL,
            SiteCode VARCHAR(50),
            AccessLevel VARCHAR(3),
            Name NVARCHAR(50),
            FirstName NVARCHAR(30),
            LastName NVARCHAR(30),
            StaffNo NVARCHAR(100),
            Department NVARCHAR(100),
            Email NVARCHAR(50),
            TimeIn TIME,
            TimeOut TIME,
            IsActive BIT DEFAULT 1,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE()
          );
          
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
            CardNo NVARCHAR(255),
            Name NVARCHAR(255),
            Title NVARCHAR(255),
            Position NVARCHAR(255),
            Department NVARCHAR(255),
            CardType NVARCHAR(255),
            Gender NVARCHAR(255),
            MaritalStatus NVARCHAR(255),
            Company NVARCHAR(255),
            StaffNo NVARCHAR(255),
            TrDateTime DATETIME,
            TrDate DATETIME,
            dtTransaction NVARCHAR(255),
            TrController NVARCHAR(255),
            ClockEvent NVARCHAR(255),
            InsertedDate DATETIME DEFAULT GETDATE(),
            Processed INT NOT NULL DEFAULT 0,
            UnitNo VARCHAR(50),
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE()
          );
          
          PRINT 'tblAttendanceReport table created successfully';
        END
        ELSE
        BEGIN
          PRINT 'tblAttendanceReport table already exists';
        END
      `;

      await this.targetPool.request().query(createTablesSQL);

      // Now add missing columns to existing tables
      await this.updateExistingTables();

      // Create indexes
      await this.createIndexes();

      console.log('✅ Target schema created successfully');
      
      this.logMigration('SCHEMA_CREATION', 'Target database schema created successfully');
    } catch (error) {
      console.error('❌ Schema creation failed:', error);
      throw error;
    }
  }

  // Update existing tables with missing columns
  async updateExistingTables() {
    try {
      console.log('🔄 Updating existing tables with missing columns...');

      const updateTablesSQL = `
        -- Add missing columns to CardDBTimeSchedule if they don't exist
        IF EXISTS (SELECT * FROM sysobjects WHERE name='CardDBTimeSchedule' AND xtype='U')
        BEGIN
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'ID')
            ALTER TABLE CardDBTimeSchedule ADD ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID();
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'CardNo')
            ALTER TABLE CardDBTimeSchedule ADD CardNo VARCHAR(16) NOT NULL;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'SiteCode')
            ALTER TABLE CardDBTimeSchedule ADD SiteCode VARCHAR(50);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'AccessLevel')
            ALTER TABLE CardDBTimeSchedule ADD AccessLevel VARCHAR(3);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'Name')
            ALTER TABLE CardDBTimeSchedule ADD Name NVARCHAR(50);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'FirstName')
            ALTER TABLE CardDBTimeSchedule ADD FirstName NVARCHAR(30);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'LastName')
            ALTER TABLE CardDBTimeSchedule ADD LastName NVARCHAR(30);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'StaffNo')
            ALTER TABLE CardDBTimeSchedule ADD StaffNo NVARCHAR(100);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'Department')
            ALTER TABLE CardDBTimeSchedule ADD Department NVARCHAR(100);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'Email')
            ALTER TABLE CardDBTimeSchedule ADD Email NVARCHAR(50);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'TimeIn')
            ALTER TABLE CardDBTimeSchedule ADD TimeIn TIME;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'TimeOut')
            ALTER TABLE CardDBTimeSchedule ADD TimeOut TIME;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'IsActive')
            ALTER TABLE CardDBTimeSchedule ADD IsActive BIT DEFAULT 1;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'CreatedAt')
            ALTER TABLE CardDBTimeSchedule ADD CreatedAt DATETIME DEFAULT GETDATE();
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('CardDBTimeSchedule') AND name = 'UpdatedAt')
            ALTER TABLE CardDBTimeSchedule ADD UpdatedAt DATETIME DEFAULT GETDATE();
          
          PRINT 'CardDBTimeSchedule table updated with missing columns';
        END

        -- Add missing columns to tblAttendanceReport if they don't exist
        IF EXISTS (SELECT * FROM sysobjects WHERE name='tblAttendanceReport' AND xtype='U')
        BEGIN
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'CardNo')
            ALTER TABLE tblAttendanceReport ADD CardNo NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Name')
            ALTER TABLE tblAttendanceReport ADD Name NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Title')
            ALTER TABLE tblAttendanceReport ADD Title NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Position')
            ALTER TABLE tblAttendanceReport ADD Position NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Department')
            ALTER TABLE tblAttendanceReport ADD Department NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'CardType')
            ALTER TABLE tblAttendanceReport ADD CardType NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Gender')
            ALTER TABLE tblAttendanceReport ADD Gender NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'MaritalStatus')
            ALTER TABLE tblAttendanceReport ADD MaritalStatus NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Company')
            ALTER TABLE tblAttendanceReport ADD Company NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'StaffNo')
            ALTER TABLE tblAttendanceReport ADD StaffNo NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'TrDateTime')
            ALTER TABLE tblAttendanceReport ADD TrDateTime DATETIME;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'TrDate')
            ALTER TABLE tblAttendanceReport ADD TrDate DATETIME;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'dtTransaction')
            ALTER TABLE tblAttendanceReport ADD dtTransaction NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'TrController')
            ALTER TABLE tblAttendanceReport ADD TrController NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'ClockEvent')
            ALTER TABLE tblAttendanceReport ADD ClockEvent NVARCHAR(255);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'InsertedDate')
            ALTER TABLE tblAttendanceReport ADD InsertedDate DATETIME DEFAULT GETDATE();
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'Processed')
            ALTER TABLE tblAttendanceReport ADD Processed INT NOT NULL DEFAULT 0;
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'UnitNo')
            ALTER TABLE tblAttendanceReport ADD UnitNo VARCHAR(50);
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'CreatedAt')
            ALTER TABLE tblAttendanceReport ADD CreatedAt DATETIME DEFAULT GETDATE();
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tblAttendanceReport') AND name = 'UpdatedAt')
            ALTER TABLE tblAttendanceReport ADD UpdatedAt DATETIME DEFAULT GETDATE();
          
          PRINT 'tblAttendanceReport table updated with missing columns';
        END
      `;

      await this.targetPool.request().query(updateTablesSQL);
      console.log('✅ Existing tables updated successfully');
    } catch (error) {
      console.error('❌ Table update failed:', error);
      throw error;
    }
  }

  // Create indexes
  async createIndexes() {
    try {
      console.log('📊 Creating indexes...');

      const createIndexesSQL = `
        -- Create indexes for CardDBTimeSchedule
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_CardNo')
          CREATE UNIQUE INDEX IX_CardDBTimeSchedule_CardNo ON CardDBTimeSchedule(CardNo);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_StaffNo')
          CREATE INDEX IX_CardDBTimeSchedule_StaffNo ON CardDBTimeSchedule(StaffNo);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_Department')
          CREATE INDEX IX_CardDBTimeSchedule_Department ON CardDBTimeSchedule(Department);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_Name')
          CREATE INDEX IX_CardDBTimeSchedule_Name ON CardDBTimeSchedule(Name);

        -- Create indexes for tblAttendanceReport
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_CardNo')
          CREATE INDEX IX_tblAttendanceReport_CardNo ON tblAttendanceReport(CardNo);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_StaffNo')
          CREATE INDEX IX_tblAttendanceReport_StaffNo ON tblAttendanceReport(StaffNo);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_TrDate')
          CREATE INDEX IX_tblAttendanceReport_TrDate ON tblAttendanceReport(TrDate);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_TrDateTime')
          CREATE INDEX IX_tblAttendanceReport_TrDateTime ON tblAttendanceReport(TrDateTime);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_ClockEvent')
          CREATE INDEX IX_tblAttendanceReport_ClockEvent ON tblAttendanceReport(ClockEvent);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_Department')
          CREATE INDEX IX_tblAttendanceReport_Department ON tblAttendanceReport(Department);
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_StaffNo_TrDate')
          CREATE INDEX IX_tblAttendanceReport_StaffNo_TrDate ON tblAttendanceReport(StaffNo, TrDate);
      `;

      await this.targetPool.request().query(createIndexesSQL);
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.error('❌ Index creation failed:', error);
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

      // Get data from source - include all columns
      const sourceData = await this.sourcePool.request().query(`
        SELECT ID, CardNo, SiteCode, AccessLevel, Name, FirstName, LastName, 
               StaffNo, Department, Email, TimeIn, TimeOut
        FROM CardDBTimeSchedule
        WHERE CardNo IS NOT NULL AND CardNo <> ''
        ORDER BY CardNo
      `);

      if (sourceData.recordset.length === 0) {
        console.log('⚠️  No valid schedule data found in source database');
        return 0;
      }

      console.log(`📊 Found ${sourceData.recordset.length} valid schedule records`);

      // Insert data into target
      let insertedCount = 0;
      let skippedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < sourceData.recordset.length; i += batchSize) {
        const batch = sourceData.recordset.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            await this.targetPool.request()
              .input('ID', sql.UniqueIdentifier, record.ID)
              .input('CardNo', sql.VarChar(16), record.CardNo)
              .input('SiteCode', sql.VarChar(50), record.SiteCode)
              .input('AccessLevel', sql.VarChar(3), record.AccessLevel)
              .input('Name', sql.NVarChar(50), record.Name)
              .input('FirstName', sql.NVarChar(30), record.FirstName)
              .input('LastName', sql.NVarChar(30), record.LastName)
              .input('StaffNo', sql.NVarChar(100), record.StaffNo)
              .input('Department', sql.NVarChar(100), record.Department)
              .input('Email', sql.NVarChar(50), record.Email)
              .input('TimeIn', sql.Time, record.TimeIn)
              .input('TimeOut', sql.Time, record.TimeOut)
              .query(`
                INSERT INTO CardDBTimeSchedule (ID, CardNo, SiteCode, AccessLevel, Name, FirstName, LastName, 
                                              StaffNo, Department, Email, TimeIn, TimeOut)
                VALUES (@ID, @CardNo, @SiteCode, @AccessLevel, @Name, @FirstName, @LastName, 
                        @StaffNo, @Department, @Email, @TimeIn, @TimeOut)
              `);
            insertedCount++;
          } catch (error) {
            console.error(`❌ Failed to insert schedule record for CardNo ${record.CardNo}:`, error.message);
            skippedCount++;
          }
        }
        
        console.log(`📊 Processed ${Math.min(i + batchSize, sourceData.recordset.length)} / ${sourceData.recordset.length} schedule records`);
      }

      console.log(`✅ Schedule migration completed: ${insertedCount} records migrated, ${skippedCount} records skipped`);
      this.logMigration('SCHEDULE_MIGRATION', `${insertedCount} schedule records migrated successfully, ${skippedCount} records skipped`);
      
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

      // Get data from source - include all columns
      const sourceData = await this.sourcePool.request().query(`
        SELECT CardNo, Name, Title, Position, Department, CardType, Gender, MaritalStatus, 
               Company, StaffNo, TrDateTime, TrDate, dtTransaction, TrController, ClockEvent, 
               InsertedDate, Processed, UnitNo
        FROM tblAttendanceReport
        WHERE CardNo IS NOT NULL AND CardNo <> ''
        ORDER BY TrDate DESC, TrDateTime DESC
      `);

      if (sourceData.recordset.length === 0) {
        console.log('⚠️  No valid attendance data found in source database');
        return 0;
      }

      console.log(`📊 Found ${sourceData.recordset.length} valid attendance records`);

      // Insert data into target
      let insertedCount = 0;
      let skippedCount = 0;
      const batchSize = 500;
      
      for (let i = 0; i < sourceData.recordset.length; i += batchSize) {
        const batch = sourceData.recordset.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            await this.targetPool.request()
              .input('CardNo', sql.NVarChar(255), record.CardNo)
              .input('Name', sql.NVarChar(255), record.Name)
              .input('Title', sql.NVarChar(255), record.Title)
              .input('Position', sql.NVarChar(255), record.Position)
              .input('Department', sql.NVarChar(255), record.Department)
              .input('CardType', sql.NVarChar(255), record.CardType)
              .input('Gender', sql.NVarChar(255), record.Gender)
              .input('MaritalStatus', sql.NVarChar(255), record.MaritalStatus)
              .input('Company', sql.NVarChar(255), record.Company)
              .input('StaffNo', sql.NVarChar(255), record.StaffNo)
              .input('TrDateTime', sql.DateTime, record.TrDateTime)
              .input('TrDate', sql.DateTime, record.TrDate)
              .input('dtTransaction', sql.NVarChar(255), record.dtTransaction)
              .input('TrController', sql.NVarChar(255), record.TrController)
              .input('ClockEvent', sql.NVarChar(255), record.ClockEvent)
              .input('InsertedDate', sql.DateTime, record.InsertedDate)
              .input('Processed', sql.Int, record.Processed || 0)
              .input('UnitNo', sql.VarChar(50), record.UnitNo)
              .query(`
                INSERT INTO tblAttendanceReport (CardNo, Name, Title, Position, Department, CardType, Gender, MaritalStatus, 
                                               Company, StaffNo, TrDateTime, TrDate, dtTransaction, TrController, ClockEvent, 
                                               InsertedDate, Processed, UnitNo)
                VALUES (@CardNo, @Name, @Title, @Position, @Department, @CardType, @Gender, @MaritalStatus, 
                        @Company, @StaffNo, @TrDateTime, @TrDate, @dtTransaction, @TrController, @ClockEvent, 
                        @InsertedDate, @Processed, @UnitNo)
              `);
            insertedCount++;
          } catch (error) {
            console.error(`❌ Failed to insert attendance record for CardNo ${record.CardNo}:`, error.message);
            skippedCount++;
          }
        }
        
        console.log(`📊 Processed ${Math.min(i + batchSize, sourceData.recordset.length)} / ${sourceData.recordset.length} attendance records`);
      }

      console.log(`✅ Attendance migration completed: ${insertedCount} records migrated, ${skippedCount} records skipped`);
      this.logMigration('ATTENDANCE_MIGRATION', `${insertedCount} attendance records migrated successfully, ${skippedCount} records skipped`);
      
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