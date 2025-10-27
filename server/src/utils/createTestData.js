const { poolPromise, sql } = require('../config/db');

/**
 * Create sample attendance data for testing the dashboard
 */
async function createTestData() {
  try {
    const pool = await poolPromise;
    
    console.log('Creating sample attendance data...');
    
    // Sample data for the past week
    const today = new Date();
    const sampleData = [];
    
    // Create data for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create multiple records per day
      for (let j = 0; j < 10; j++) {
        const clockInTime = new Date(date);
        clockInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const clockOutTime = new Date(date);
        clockOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        // Clock In record
        sampleData.push({
          CardNo: `CARD${1000 + j}`,
          Name: `Employee ${j + 1}`,
          Title: 'Staff',
          Position: 'Employee',
          Department: j % 3 === 0 ? 'IT' : j % 3 === 1 ? 'HR' : 'Finance',
          CardType: 'Employee',
          Company: 'MTI',
          StaffNo: `EMP${1000 + j}`,
          TrDateTime: clockInTime,
          TrDate: date.toISOString().split('T')[0],
          dtTransaction: clockInTime,
          TrController: 'CONTROLLER_01',
          ClockEvent: 'Clock In',
          UnitNo: '001',
          InsertedDate: new Date(),
          Processed: Math.random() > 0.1 ? 1 : 0 // 90% valid records
        });
        
        // Clock Out record
        sampleData.push({
          CardNo: `CARD${1000 + j}`,
          Name: `Employee ${j + 1}`,
          Title: 'Staff',
          Position: 'Employee',
          Department: j % 3 === 0 ? 'IT' : j % 3 === 1 ? 'HR' : 'Finance',
          CardType: 'Employee',
          Company: 'MTI',
          StaffNo: `EMP${1000 + j}`,
          TrDateTime: clockOutTime,
          TrDate: date.toISOString().split('T')[0],
          dtTransaction: clockOutTime,
          TrController: 'CONTROLLER_01',
          ClockEvent: 'Clock Out',
          UnitNo: '001',
          InsertedDate: new Date(),
          Processed: Math.random() > 0.1 ? 1 : 0 // 90% valid records
        });
      }
    }
    
    console.log(`Inserting ${sampleData.length} sample records...`);
    
    // Insert all records
    let insertedCount = 0;
    for (const record of sampleData) {
      try {
        // Check for duplicates first
        const duplicateCheck = `
          SELECT COUNT(*) as count
          FROM tblAttendanceReport
          WHERE StaffNo = @staffNo
          AND TrDateTime = @trDateTime
          AND ClockEvent = @clockEvent
        `;

        const duplicateResult = await pool.request()
          .input('staffNo', sql.NVarChar, record.StaffNo)
          .input('trDateTime', sql.DateTime, record.TrDateTime)
          .input('clockEvent', sql.NVarChar, record.ClockEvent)
          .query(duplicateCheck);

        if (duplicateResult.recordset[0].count > 0) {
          console.log(`Skipping duplicate record for ${record.StaffNo} at ${record.TrDateTime}`);
          continue;
        }

        // Insert new record
        const insertQuery = `
          INSERT INTO tblAttendanceReport (
            CardNo, Name, Title, Position, Department, CardType,
            Company, StaffNo, TrDateTime, TrDate,
            dtTransaction, TrController, ClockEvent, UnitNo, InsertedDate, Processed
          )
          VALUES (
            @cardNo, @name, @title, @position, @department, @cardType,
            @company, @staffNo, @trDateTime, @trDate,
            @dtTransaction, @trController, @clockEvent, @unitNo, @insertedDate, @processed
          )
        `;

        await pool.request()
          .input('cardNo', sql.NVarChar, record.CardNo)
          .input('name', sql.NVarChar, record.Name)
          .input('title', sql.NVarChar, record.Title)
          .input('position', sql.NVarChar, record.Position)
          .input('department', sql.NVarChar, record.Department)
          .input('cardType', sql.NVarChar, record.CardType)
          .input('company', sql.NVarChar, record.Company)
          .input('staffNo', sql.NVarChar, record.StaffNo)
          .input('trDateTime', sql.DateTime, record.TrDateTime)
          .input('trDate', sql.Date, record.TrDate)
          .input('dtTransaction', sql.DateTime, record.dtTransaction)
          .input('trController', sql.NVarChar, record.TrController)
          .input('clockEvent', sql.NVarChar, record.ClockEvent)
          .input('unitNo', sql.NVarChar, record.UnitNo)
          .input('insertedDate', sql.DateTime, record.InsertedDate)
          .input('processed', sql.Bit, record.Processed)
          .query(insertQuery);
        
        insertedCount++;
      } catch (error) {
        console.error(`Failed to insert record for ${record.StaffNo}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} test records`);
    
    // Verify the data
    const verifyQuery = `
      SELECT 
        COUNT(*) as totalRecords,
        SUM(CASE WHEN ClockEvent = 'Clock In' THEN 1 ELSE 0 END) AS totalClockIn,
        SUM(CASE WHEN ClockEvent = 'Clock Out' THEN 1 ELSE 0 END) AS totalClockOut,
        SUM(CASE WHEN Processed = 1 THEN 1 ELSE 0 END) AS validRecords,
        SUM(CASE WHEN Processed = 0 THEN 1 ELSE 0 END) AS invalidRecords
      FROM tblAttendanceReport
      WHERE TrDate >= DATEADD(day, -7, GETDATE())
    `;
    
    const verifyResult = await pool.request().query(verifyQuery);
    console.log('📊 Data verification:', verifyResult.recordset[0]);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('Test data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test data creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestData };