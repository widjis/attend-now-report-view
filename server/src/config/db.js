
const sql = require('mssql');

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use encryption if connecting to Azure SQL
    trustServerCertificate: true // Change to false for production
  },
  port: parseInt(process.env.DB_PORT) || 1433
};

// Create database schema and tables if they don't exist
const initializeDatabase = async (pool) => {
  try {
    console.log('Checking if database schema exists...');
    
    // Check if AttendanceRecords table exists
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('AttendanceRecords') as TableExists
    `);
    
    if (!tableCheck.recordset[0].TableExists) {
      console.log('Creating AttendanceRecords table...');
      
      // Create AttendanceRecords table
      await pool.request().query(`
        CREATE TABLE AttendanceRecords (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          CardNo NVARCHAR(50),
          Name NVARCHAR(100),
          Title NVARCHAR(100),
          Position NVARCHAR(100),
          Department NVARCHAR(100),
          CardType NVARCHAR(50),
          Gender NVARCHAR(10),
          MaritalStatus NVARCHAR(20),
          Company NVARCHAR(100),
          StaffNo NVARCHAR(50),
          TrDateTime DATETIME,
          TrDate DATE,
          dtTransaction NVARCHAR(50),
          TrController NVARCHAR(50),
          ClockEvent NVARCHAR(20),
          InsertedDate DATETIME DEFAULT GETDATE(),
          Processed BIT DEFAULT 1,
          UnitNo NVARCHAR(50)
        )
      `);
      
      console.log('Table created successfully.');
      
      // Insert sample data for testing
      console.log('Inserting sample data...');
      
      // Create date range for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Generate departments
      const departments = ['HR', 'IT', 'Finance', 'Operations', 'Marketing'];
      const companies = ['Company A', 'Company B', 'Company C'];
      const cardTypes = ['Employee', 'Contractor', 'Visitor'];
      const controllers = ['Main Gate', 'Office Entry', 'Cafeteria', 'Parking Lot'];
      const clockEvents = ['Clock In', 'Clock Out'];
      
      // Insert 500 sample records
      for (let i = 1; i <= 500; i++) {
        const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (today.getTime() - thirtyDaysAgo.getTime()));
        const trDate = randomDate.toISOString().split('T')[0];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const controller = controllers[Math.floor(Math.random() * controllers.length)];
        const clockEvent = clockEvents[Math.floor(Math.random() * clockEvents.length)];
        const processed = Math.random() > 0.1 ? 1 : 0; // 90% valid records
        
        await pool.request()
          .input('cardNo', sql.NVarChar, `CARD${1000 + i}`)
          .input('name', sql.NVarChar, `Employee ${i}`)
          .input('title', sql.NVarChar, `Title ${i % 5 + 1}`)
          .input('position', sql.NVarChar, `Position ${i % 8 + 1}`)
          .input('department', sql.NVarChar, department)
          .input('cardType', sql.NVarChar, cardType)
          .input('gender', sql.NVarChar, i % 2 === 0 ? 'Male' : 'Female')
          .input('maritalStatus', sql.NVarChar, i % 3 === 0 ? 'Single' : 'Married')
          .input('company', sql.NVarChar, company)
          .input('staffNo', sql.NVarChar, `EMP${1000 + i}`)
          .input('trDateTime', sql.DateTime, randomDate)
          .input('trDate', sql.Date, trDate)
          .input('dtTransaction', sql.NVarChar, `TR${1000 + i}`)
          .input('trController', sql.NVarChar, controller)
          .input('clockEvent', sql.NVarChar, clockEvent)
          .input('processed', sql.Bit, processed)
          .input('unitNo', sql.NVarChar, `UNIT${i % 10 + 1}`)
          .query(`
            INSERT INTO AttendanceRecords (
              CardNo, Name, Title, Position, Department, CardType, 
              Gender, MaritalStatus, Company, StaffNo, TrDateTime, 
              TrDate, dtTransaction, TrController, ClockEvent, 
              Processed, UnitNo
            )
            VALUES (
              @cardNo, @name, @title, @position, @department, @cardType,
              @gender, @maritalStatus, @company, @staffNo, @trDateTime,
              @trDate, @dtTransaction, @trController, @clockEvent,
              @processed, @unitNo
            )
          `);
      }
      
      console.log('Sample data inserted successfully.');
    } else {
      console.log('Database schema already exists.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log('Connected to MSSQL');
    await initializeDatabase(pool);
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
