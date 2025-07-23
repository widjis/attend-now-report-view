
const sql = require('mssql');

// Main Database Configuration - EmployeeWorkflow
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use encryption if connecting to Azure SQL
    trustServerCertificate: true, // Change to false for production
    enableArithAbort: true,
    multipleActiveResultSets: true // Enable multiple active result sets for cross-database queries
  },
  port: parseInt(process.env.DB_PORT) || 1433
};

// DataDBEnt Database Configuration - For attendance transactions and CardDB
const dataDbConfig = {
  user: process.env.DATADB_USER,
  password: process.env.DATADB_PASSWORD,
  server: process.env.DATADB_SERVER,
  database: process.env.DATADB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    multipleActiveResultSets: true
  },
  port: parseInt(process.env.DATADB_PORT) || 1433
};

// ORANGE-PROD Database Configuration - For MCG clocking table
const orangeDbConfig = {
  user: process.env.ORANGE_DB_USER,
  password: process.env.ORANGE_DB_PASSWORD,
  server: process.env.ORANGE_DB_SERVER,
  database: process.env.ORANGE_DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    multipleActiveResultSets: true
  },
  port: parseInt(process.env.ORANGE_DB_PORT) || 1433
};

// Create database connection pools
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL - EmployeeWorkflow');
    return pool;
  })
  .catch(err => {
    console.error('EmployeeWorkflow Database Connection Failed:', err);
    throw err;
  });

const dataDbPoolPromise = new sql.ConnectionPool(dataDbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL - DataDBEnt');
    return pool;
  })
  .catch(err => {
    console.error('DataDBEnt Database Connection Failed:', err);
    throw err;
  });

const orangeDbPoolPromise = new sql.ConnectionPool(orangeDbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL - ORANGE-PROD');
    return pool;
  })
  .catch(err => {
    console.error('ORANGE-PROD Database Connection Failed:', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,           // EmployeeWorkflow database
  dataDbPoolPromise,     // DataDBEnt database
  orangeDbPoolPromise,   // ORANGE-PROD database
  config,
  dataDbConfig,
  orangeDbConfig
};
