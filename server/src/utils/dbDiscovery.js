const sql = require('mssql');

/**
 * Standalone Database Inspection Script
 * This script will help identify the database configuration and inspect tables
 */

// Function to test different common database configurations
async function testDatabaseConnections() {
  const commonConfigs = [
    {
      name: 'Local SQL Server (Windows Auth)',
      config: {
        server: 'localhost',
        database: 'master',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          integratedSecurity: true
        }
      }
    },
    {
      name: 'Local SQL Server Express (Windows Auth)',
      config: {
        server: 'localhost\\SQLEXPRESS',
        database: 'master',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          integratedSecurity: true
        }
      }
    },
    {
      name: 'Local SQL Server (sa account)',
      config: {
        user: 'sa',
        password: 'password', // Common default
        server: 'localhost',
        database: 'master',
        options: {
          encrypt: false,
          trustServerCertificate: true
        }
      }
    }
  ];

  console.log('🔍 Testing common database configurations...\n');

  for (const { name, config } of commonConfigs) {
    try {
      console.log(`Testing: ${name}`);
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      
      console.log(`✅ Successfully connected with: ${name}`);
      
      // Get list of databases
      const result = await pool.request().query('SELECT name FROM sys.databases WHERE name NOT IN (\'master\', \'tempdb\', \'model\', \'msdb\')');
      console.log('📊 Available databases:');
      result.recordset.forEach(db => {
        console.log(`   - ${db.name}`);
      });
      
      await pool.close();
      console.log('');
      return { name, config, databases: result.recordset };
      
    } catch (err) {
      console.log(`❌ Failed to connect with: ${name}`);
      console.log(`   Error: ${err.message}\n`);
    }
  }
  
  return null;
}

// Function to inspect a specific database
async function inspectDatabase(config, databaseName) {
  try {
    const dbConfig = { ...config, database: databaseName };
    const pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();
    
    console.log(`\n🔍 Inspecting database: ${databaseName}`);
    console.log('=' .repeat(50));
    
    // Get all tables
    const tablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tablesResult = await pool.request().query(tablesQuery);
    console.log(`\n📋 Found ${tablesResult.recordset.length} tables:`);
    
    for (const table of tablesResult.recordset) {
      console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
      
      // Check if this looks like our target tables
      if (table.TABLE_NAME.toLowerCase().includes('schedule') || 
          table.TABLE_NAME.toLowerCase().includes('time') ||
          table.TABLE_NAME.toLowerCase().includes('mti') ||
          table.TABLE_NAME.toLowerCase().includes('card')) {
        
        console.log(`     🎯 Potential target table found!`);
        
        // Get column information
        const columnsQuery = `
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
            AND TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `;
        
        const columnsResult = await pool.request().query(columnsQuery);
        console.log(`     📊 Columns (${columnsResult.recordset.length}):`);
        columnsResult.recordset.forEach(col => {
          console.log(`       - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.IS_NULLABLE === 'YES' ? ', nullable' : ''})`);
        });
        
        // Get sample data
        try {
          const sampleQuery = `SELECT TOP 3 * FROM [${table.TABLE_SCHEMA}].[${table.TABLE_NAME}]`;
          const sampleResult = await pool.request().query(sampleQuery);
          console.log(`     📝 Sample data (${sampleResult.recordset.length} rows):`);
          if (sampleResult.recordset.length > 0) {
            console.log('       ', JSON.stringify(sampleResult.recordset[0], null, 2).substring(0, 200) + '...');
          }
        } catch (sampleErr) {
          console.log(`     ⚠️  Could not retrieve sample data: ${sampleErr.message}`);
        }
        
        console.log('');
      }
    }
    
    await pool.close();
    return tablesResult.recordset;
    
  } catch (err) {
    console.error(`❌ Error inspecting database ${databaseName}:`, err.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Discovery and Inspection');
  console.log('=' .repeat(60));
  
  // Test connections
  const workingConnection = await testDatabaseConnections();
  
  if (!workingConnection) {
    console.log('❌ Could not establish any database connection.');
    console.log('💡 Please check:');
    console.log('   1. SQL Server is running');
    console.log('   2. SQL Server allows connections');
    console.log('   3. Windows Authentication is enabled OR you have valid credentials');
    console.log('   4. Firewall allows SQL Server connections');
    return;
  }
  
  console.log(`✅ Using working connection: ${workingConnection.name}`);
  
  // Inspect each available database
  for (const db of workingConnection.databases) {
    await inspectDatabase(workingConnection.config, db.name);
  }
  
  console.log('\n🎉 Database inspection completed!');
  console.log('💡 Look for tables containing schedule, time, MTI, or card data above.');
}

// Run the inspection
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});