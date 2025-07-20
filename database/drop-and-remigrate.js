const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

// Database configurations
const targetConfig = {
  user: process.env.TARGET_DB_USER,
  password: process.env.TARGET_DB_PASSWORD,
  server: process.env.TARGET_DB_SERVER,
  database: process.env.TARGET_DB_NAME,
  port: parseInt(process.env.TARGET_DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 300000,
    connectionTimeout: 60000
  }
};

class DropAndRemigrate {
  constructor() {
    this.targetPool = null;
  }

  async initialize() {
    try {
      console.log('🔗 Connecting to target database (EmployeeWorkflow)...');
      this.targetPool = await new sql.ConnectionPool(targetConfig).connect();
      console.log('✅ Connected to target database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async dropTables() {
    try {
      console.log('🗑️  Dropping existing tables...');
      
      const dropTablesSQL = `
        -- Drop indexes first
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_CardNo')
          DROP INDEX IX_CardDBTimeSchedule_CardNo ON CardDBTimeSchedule;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_StaffNo')
          DROP INDEX IX_CardDBTimeSchedule_StaffNo ON CardDBTimeSchedule;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_Department')
          DROP INDEX IX_CardDBTimeSchedule_Department ON CardDBTimeSchedule;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CardDBTimeSchedule_Name')
          DROP INDEX IX_CardDBTimeSchedule_Name ON CardDBTimeSchedule;

        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_CardNo')
          DROP INDEX IX_tblAttendanceReport_CardNo ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_StaffNo')
          DROP INDEX IX_tblAttendanceReport_StaffNo ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_TrDate')
          DROP INDEX IX_tblAttendanceReport_TrDate ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_TrDateTime')
          DROP INDEX IX_tblAttendanceReport_TrDateTime ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_ClockEvent')
          DROP INDEX IX_tblAttendanceReport_ClockEvent ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_Department')
          DROP INDEX IX_tblAttendanceReport_Department ON tblAttendanceReport;
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tblAttendanceReport_StaffNo_TrDate')
          DROP INDEX IX_tblAttendanceReport_StaffNo_TrDate ON tblAttendanceReport;

        -- Drop tables
        IF EXISTS (SELECT * FROM sysobjects WHERE name='tblAttendanceReport' AND xtype='U')
        BEGIN
          DROP TABLE tblAttendanceReport;
          PRINT 'tblAttendanceReport table dropped successfully';
        END

        IF EXISTS (SELECT * FROM sysobjects WHERE name='CardDBTimeSchedule' AND xtype='U')
        BEGIN
          DROP TABLE CardDBTimeSchedule;
          PRINT 'CardDBTimeSchedule table dropped successfully';
        END
      `;

      await this.targetPool.request().query(dropTablesSQL);
      console.log('✅ Tables dropped successfully');
    } catch (error) {
      console.error('❌ Table drop failed:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.targetPool) {
        await this.targetPool.close();
        console.log('🔌 Target database connection closed');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Main execution
async function main() {
  const dropAndRemigrate = new DropAndRemigrate();
  
  try {
    console.log('🚀 Starting drop and remigrate process...');
    
    // Initialize connections
    await dropAndRemigrate.initialize();
    
    // Drop existing tables
    await dropAndRemigrate.dropTables();
    
    console.log('✅ Drop process completed successfully!');
    console.log('');
    console.log('🔄 Now you can run the migration script:');
    console.log('   node migrate-data.js');
    
  } catch (error) {
    console.error('💥 Drop and remigrate process failed:', error);
    process.exit(1);
  } finally {
    await dropAndRemigrate.cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Process terminated');
  process.exit(0);
});

// Run the main function
main().catch(console.error);