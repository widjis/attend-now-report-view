
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

// Create database connection pools with lazy initialization
let poolPromise = null;
let dataDbPoolPromise = null;
let orangeDbPoolPromise = null;

// Lazy connection function for EmployeeWorkflow
const getPoolPromise = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('Connected to MSSQL - EmployeeWorkflow');
        return pool;
      })
      .catch(err => {
        console.error('EmployeeWorkflow Database Connection Failed:', err);
        poolPromise = null; // Reset so it can be retried
        throw err;
      });
  }
  return poolPromise;
};

// Lazy connection function for DataDBEnt
const getDataDbPoolPromise = () => {
  if (!dataDbPoolPromise) {
    dataDbPoolPromise = new sql.ConnectionPool(dataDbConfig)
      .connect()
      .then(pool => {
        console.log('Connected to MSSQL - DataDBEnt');
        return pool;
      })
      .catch(err => {
        console.error('DataDBEnt Database Connection Failed:', err);
        dataDbPoolPromise = null; // Reset so it can be retried
        throw err;
      });
  }
  return dataDbPoolPromise;
};

// Lazy connection function for ORANGE-PROD
const getOrangeDbPoolPromise = () => {
  if (!orangeDbPoolPromise) {
    orangeDbPoolPromise = new sql.ConnectionPool(orangeDbConfig)
      .connect()
      .then(pool => {
        console.log('Connected to MSSQL - ORANGE-PROD');
        return pool;
      })
      .catch(err => {
        console.error('ORANGE-PROD Database Connection Failed:', err);
        orangeDbPoolPromise = null; // Reset so it can be retried
        throw err;
      });
  }
  return orangeDbPoolPromise;
};

module.exports = {
  sql,
  get poolPromise() { return getPoolPromise(); },           // EmployeeWorkflow database (lazy)
  get dataDbPoolPromise() { return getDataDbPoolPromise(); },     // DataDBEnt database (lazy)
  get orangeDbPoolPromise() { return getOrangeDbPoolPromise(); },   // ORANGE-PROD database (lazy)
  getPoolPromise,                          // Direct access to lazy function
  getDataDbPoolPromise,                    // Direct access to lazy function
  getOrangeDbPoolPromise,                  // Direct access to lazy function
  config,
  dataDbConfig,
  orangeDbConfig
};
