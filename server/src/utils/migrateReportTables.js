require('dotenv').config();
const sql = require('mssql');

/**
 * Migration script to add missing columns to tblReportGenerationLog
 */
async function migrateReportTables() {
  try {
    console.log('=== MIGRATING REPORT TABLES ===\n');
    
    // Database configuration for EmployeeWorkflow (where tblReportGenerationLog is located)
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 1433,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        multipleActiveResultSets: true
      }
    };

    console.log(`Connecting to database: ${config.server}:${config.port}/${config.database}`);
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('Checking and adding missing columns to tblReportGenerationLog...');
    
    // Add missing columns if they don't exist
    const migrations = [
      {
        column: 'RecordsProcessed',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsProcessed')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsProcessed] [int] NULL;`
      },
      {
        column: 'RecordsInserted',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsInserted')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsInserted] [int] NULL;`
      },
      {
        column: 'RecordsSkipped',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsSkipped')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsSkipped] [int] NULL;`
      },
      {
        column: 'Parameters',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'Parameters')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [Parameters] [nvarchar](max) NULL;`
      },
      {
        column: 'ExecutionTimeMs',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'ExecutionTimeMs')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [ExecutionTimeMs] [int] NULL;`
      },
      {
        column: 'CreatedBy',
        sql: `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'CreatedBy')
              ALTER TABLE [dbo].[tblReportGenerationLog] ADD [CreatedBy] [nvarchar](50) NULL;`
      }
    ];

    for (const migration of migrations) {
      try {
        console.log(`Adding column: ${migration.column}...`);
        await pool.request().query(migration.sql);
        console.log(`✓ Column ${migration.column} added successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✓ Column ${migration.column} already exists`);
        } else {
          console.error(`✗ Error adding column ${migration.column}:`, error.message);
        }
      }
    }

    // Verify all columns exist
    console.log('\nVerifying table structure...');
    const verifyQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'tblReportGenerationLog'
      ORDER BY ORDINAL_POSITION
    `;
    
    const result = await pool.request().query(verifyQuery);
    
    console.log('\nCurrent table structure:');
    console.log('Column Name\t\tData Type\tNullable');
    console.log('----------------------------------------');
    result.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)}\t${col.DATA_TYPE.padEnd(12)}\t${col.IS_NULLABLE}`);
    });

    console.log('\n✅ Migration completed successfully!');
    
    // Close the connection
    await pool.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateReportTables()
    .then(() => {
      console.log('\n🎉 Database migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateReportTables };