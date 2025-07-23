const { poolPromise, dataDbPoolPromise, sql } = require('../config/db');

/**
 * Attendance Processing Service
 * Replicates the Python script functionality for processing attendance data
 */
class AttendanceProcessingService {
  constructor() {
    this.toleranceSeconds = 3600; // 1 hour tolerance for clock events
    this.controllerList = [
      'FR-Acid Halte-4626',
      'FR-Acid Roaster-4102',
      'FR-CCP Office 1 Temp',
      'FR-CCP Office 2 Temp',
      'FR-Chloride Office-5633',
      'FR-Chloride Pos Security-5633',
      'FR-Pyrite Office-5635',
      'FR-Pyrite Toilet-3104',
      'FR-Pyrite Warehouse-4522'
    ];
  }

  /**
   * Retrieve attendance transactions from tblTransaction with filters
   * @param {Date} startDateTime - Start date and time
   * @param {Date} endDateTime - End date and time
   * @param {Array} controllerList - Optional list of controllers to filter
   * @returns {Array} Array of transaction records
   */
  async retrieveAttendanceTransactions(startDateTime, endDateTime, controllerList = null) {
    try {
      const pool = await dataDbPoolPromise; // Use DataDBEnt database connection
      
      // First check if the required tables exist
      const tableCheckQuery = `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME IN ('CardDB', 'tblTransaction')
      `;
      const tables = await pool.request().query(tableCheckQuery);
      
      if (tables.recordset.length < 2) {
        throw new Error('Required tables (CardDB, tblTransaction) not found in DataDBEnt database');
      }
      
      const controllers = controllerList || this.controllerList;
      const dateClause = `Lt.TrDateTime BETWEEN @startDate AND @endDate`;
      
      let controllerClause = '';
      let controllerParams = '';
      
      if (controllers && controllers.length > 0) {
        controllerParams = controllers.map((_, index) => `@controller${index}`).join(', ');
        controllerClause = `AND Lt.TrController IN (${controllerParams})`;
      }

      const query = `
        SELECT 
          Cdb.CardNo, 
          Cdb.Name, 
          Cdb.Title, 
          Cdb.Position, 
          Cdb.Department, 
          Cdb.CardType, 
          Cdb.Company,
          Cdb.StaffNo,
          Lt.TrDateTime,
          Lt.TrDate,
          Lt.[Transaction] AS dtTransaction,
          Lt.TrController,
          Lt.UnitNo
        FROM 
          [CardDB] Cdb
        INNER JOIN 
          [tblTransaction] Lt ON Cdb.CardNo = Lt.CardNo
        WHERE 
          ${dateClause}
        AND
          Cdb.StaffNo LIKE 'MTI%'
        AND
          Lt.[Transaction] = 'Valid Entry Access'
          ${controllerClause}
        ORDER BY Cdb.StaffNo, Lt.TrDateTime
      `;

      const request = pool.request()
        .input('startDate', sql.DateTime, startDateTime)
        .input('endDate', sql.DateTime, endDateTime);

      // Add controller parameters
      if (controllers && controllers.length > 0) {
        controllers.forEach((controller, index) => {
          request.input(`controller${index}`, sql.NVarChar, controller);
        });
      }

      const result = await request.query(query);
      
      console.log(`Retrieved ${result.recordset.length} attendance transactions from DataDBEnt`);
      
      // Add InsertDate to each record
      const currentTime = new Date();
      return result.recordset.map(record => ({
        ...record,
        InsertDate: currentTime
      }));

    } catch (error) {
      console.error('Error retrieving attendance transactions:', error);
      throw error;
    }
  }

  /**
   * Get working hours for a staff member on a specific date
   * @param {string} staffNo - Staff number
   * @param {Date} dateVal - Date to check
   * @param {Object} manualTimes - Optional manual time override {timeIn, timeOut}
   * @returns {Object} {timeIn, timeOut} or {null, null} if not found
   */
  async getWorkingHours(staffNo, dateVal, manualTimes = null) {
    try {
      // Use manual times if provided
      if (manualTimes && manualTimes.timeIn && manualTimes.timeOut) {
        const timeIn = new Date(dateVal);
        const timeOut = new Date(dateVal);
        
        const [inHours, inMinutes] = manualTimes.timeIn.split(':');
        const [outHours, outMinutes] = manualTimes.timeOut.split(':');
        
        timeIn.setHours(parseInt(inHours), parseInt(inMinutes), 0, 0);
        timeOut.setHours(parseInt(outHours), parseInt(outMinutes), 0, 0);
        
        // Handle overnight shift
        if (timeOut <= timeIn) {
          timeOut.setDate(timeOut.getDate() + 1);
        }
        
        return { timeIn, timeOut };
      }

      const pool = await dataDbPoolPromise; // Use DataDBEnt database connection
      
      const query = `
        SELECT TOP 1 TimeIn, TimeOut 
        FROM [dbo].[CardDBTimeSchedule]
        WHERE StaffNo = @staffNo
      `;

      const result = await pool.request()
        .input('staffNo', sql.NVarChar, staffNo)
        .query(query);

      if (result.recordset.length === 0) {
        return { timeIn: null, timeOut: null };
      }

      const schedule = result.recordset[0];
      if (!schedule.TimeIn || !schedule.TimeOut) {
        return { timeIn: null, timeOut: null };
      }

      // Parse time strings and combine with date
      const timeInStr = schedule.TimeIn.split('.')[0]; // Remove milliseconds
      const timeOutStr = schedule.TimeOut.split('.')[0];

      const timeIn = new Date(dateVal);
      const timeOut = new Date(dateVal);

      const [inHours, inMinutes, inSeconds] = timeInStr.split(':');
      const [outHours, outMinutes, outSeconds] = timeOutStr.split(':');

      timeIn.setHours(parseInt(inHours), parseInt(inMinutes), parseInt(inSeconds || 0), 0);
      timeOut.setHours(parseInt(outHours), parseInt(outMinutes), parseInt(outSeconds || 0), 0);

      // Handle overnight shift
      if (timeOut <= timeIn) {
        timeOut.setDate(timeOut.getDate() + 1);
      }

      return { timeIn, timeOut };

    } catch (error) {
      console.error('Error getting working hours:', error);
      return { timeIn: null, timeOut: null };
    }
  }

  /**
   * Determine clock event based on scheduled times and tolerance
   * @param {Object} transaction - Transaction record
   * @param {Object} manualTimes - Optional manual time override
   * @returns {string} Clock event: 'Clock In', 'Clock Out', 'Outside Range', 'No Shift Data'
   */
  async determineClockEvent(transaction, manualTimes = null) {
    try {
      const staffNo = transaction.StaffNo;
      const trDateTime = new Date(transaction.TrDateTime);
      
      const { timeIn: scheduledIn, timeOut: scheduledOut } = await this.getWorkingHours(
        staffNo, 
        trDateTime, 
        manualTimes
      );

      if (!scheduledIn || !scheduledOut) {
        return 'No Shift Data';
      }

      // Check tolerance for Clock In
      const clockInDiff = Math.abs((trDateTime - scheduledIn) / 1000);
      if (clockInDiff <= this.toleranceSeconds) {
        return 'Clock In';
      }

      // Check tolerance for Clock Out or if after scheduled out time
      const clockOutDiff = Math.abs((trDateTime - scheduledOut) / 1000);
      if (clockOutDiff <= this.toleranceSeconds || trDateTime >= scheduledOut) {
        return 'Clock Out';
      }

      return 'Outside Range';

    } catch (error) {
      console.error('Error determining clock event:', error);
      return 'Outside Range';
    }
  }

  /**
   * Apply First In Last Out (FILO) logic to transactions
   * @param {Array} transactions - Array of transaction records
   * @returns {Array} Transactions with ClockEvent assigned
   */
  applyFiloLogic(transactions) {
    try {
      // Sort transactions by StaffNo, TrDate, and TrDateTime
      const sortedTransactions = [...transactions].sort((a, b) => {
        if (a.StaffNo !== b.StaffNo) {
          return a.StaffNo.localeCompare(b.StaffNo);
        }
        if (a.TrDate !== b.TrDate) {
          return new Date(a.TrDate) - new Date(b.TrDate);
        }
        return new Date(a.TrDateTime) - new Date(b.TrDateTime);
      });

      // Group by StaffNo and Date, then apply FILO logic
      const groupedTransactions = {};
      
      sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.TrDateTime).toDateString();
        const key = `${transaction.StaffNo}_${date}`;
        
        if (!groupedTransactions[key]) {
          groupedTransactions[key] = [];
        }
        groupedTransactions[key].push(transaction);
      });

      // Apply FILO logic to each group
      const processedTransactions = [];
      
      Object.values(groupedTransactions).forEach(group => {
        if (group.length === 1) {
          group[0].ClockEvent = 'Clock In';
        } else if (group.length > 1) {
          // Sort by time within the group
          group.sort((a, b) => new Date(a.TrDateTime) - new Date(b.TrDateTime));
          
          // First transaction is Clock In
          group[0].ClockEvent = 'Clock In';
          
          // Last transaction is Clock Out
          group[group.length - 1].ClockEvent = 'Clock Out';
          
          // Middle transactions are Mid Scans
          for (let i = 1; i < group.length - 1; i++) {
            group[i].ClockEvent = 'Mid Scans';
          }
        }
        
        processedTransactions.push(...group);
      });

      return processedTransactions;

    } catch (error) {
      console.error('Error applying FILO logic:', error);
      throw error;
    }
  }

  /**
   * Main orchestration method to process attendance data
   * @param {Object} params - Processing parameters
   * @returns {Array} Processed attendance records
   */
  async processAttendanceData(params) {
    try {
      const {
        startDateTime,
        endDateTime,
        controllerList = null,
        useFilo = false,
        manualTimes = null
      } = params;

      console.log('Starting attendance data processing...');
      
      // Step 1: Retrieve transactions
      const transactions = await this.retrieveAttendanceTransactions(
        startDateTime, 
        endDateTime, 
        controllerList
      );
      
      console.log(`Retrieved ${transactions.length} transactions`);

      if (transactions.length === 0) {
        return [];
      }

      // Step 2: Apply clock event logic
      let processedTransactions;
      
      if (useFilo) {
        console.log('Applying FILO logic...');
        processedTransactions = this.applyFiloLogic(transactions);
      } else {
        console.log('Applying tolerance-based clock event logic...');
        processedTransactions = [];
        
        for (const transaction of transactions) {
          const clockEvent = await this.determineClockEvent(transaction, manualTimes);
          processedTransactions.push({
            ...transaction,
            ClockEvent: clockEvent
          });
        }
      }

      console.log(`Processed ${processedTransactions.length} transactions`);
      
      return processedTransactions;

    } catch (error) {
      console.error('Error processing attendance data:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceProcessingService();