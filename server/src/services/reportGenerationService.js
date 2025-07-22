const { poolPromise, sql } = require('../config/db');
const attendanceProcessingService = require('./attendanceProcessingService');

/**
 * Report Generation Service
 * Handles report generation, database insertion, and export functionality
 * Implements the database insertion logic from attendance_report_modV4.py
 */
class ReportGenerationService {
  constructor() {
    // Orange-Temp database configuration for mcg_clocking_tbl
    this.orangeTempConfig = {
      user: process.env.ORANGE_DB_USER || 'IT.MTI',
      password: process.env.ORANGE_DB_PASSWORD || 'morowali',
      server: process.env.ORANGE_DB_SERVER || '10.1.1.75',
      database: process.env.ORANGE_DB_NAME || 'ORANGE-PROD',
      options: {
        encrypt: true,
        trustServerCertificate: true
      },
      port: parseInt(process.env.ORANGE_DB_PORT) || 1433
    };
  }

  /**
   * Connect to Orange-Temp database
   * @returns {Object} Database connection pool
   */
  async connectOrangeTemp() {
    try {
      const sql = require('mssql');
      const pool = new sql.ConnectionPool(this.orangeTempConfig);
      await pool.connect();
      return pool;
    } catch (error) {
      console.error('Error connecting to Orange-Temp database:', error);
      throw error;
    }
  }

  /**
   * Insert record into tblAttendanceReport with duplicate checking
   * @param {Object} record - Attendance record to insert
   * @returns {boolean} True if inserted, false if skipped (duplicate)
   */
  async insertToAttendanceReport(record) {
    try {
      const pool = await poolPromise;
      
      // Check for duplicates
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
        return false;
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
        .input('trDate', sql.Date, new Date(record.TrDateTime).toDateString())
        .input('dtTransaction', sql.NVarChar, record.dtTransaction)
        .input('trController', sql.NVarChar, record.TrController)
        .input('clockEvent', sql.NVarChar, record.ClockEvent)
        .input('unitNo', sql.NVarChar, record.UnitNo)
        .input('insertedDate', sql.DateTime, new Date())
        .input('processed', sql.Bit, 0)
        .query(insertQuery);

      console.log(`Inserted record for ${record.StaffNo} at ${record.TrDateTime}`);
      return true;

    } catch (error) {
      console.error(`Error inserting record for ${record.StaffNo}:`, error);
      return false;
    }
  }

  /**
   * Insert record into mcg_clocking_tbl and update processed flag
   * @param {Object} record - Attendance record to insert
   * @returns {boolean} True if inserted successfully
   */
  async insertToMcgClockingTable(record) {
    try {
      // Only process Clock In and Clock Out events
      let functionKey;
      if (record.ClockEvent === 'Clock In') {
        functionKey = 0;
      } else if (record.ClockEvent === 'Clock Out') {
        functionKey = 1;
      } else {
        console.log(`Skipping ${record.ClockEvent} for ${record.StaffNo}`);
        return false;
      }

      const orangePool = await this.connectOrangeTemp();
      const mainPool = await poolPromise;

      try {
        // Prepare data for mcg_clocking_tbl
        const terminalId = record.UnitNo || 'DEFAULT';
        const fingerPrintId = record.StaffNo;
        const trDateTime = new Date(record.TrDateTime);
        const dateLog = new Date(trDateTime.getFullYear(), trDateTime.getMonth(), trDateTime.getDate());
        const timeLog = trDateTime.toTimeString().substring(0, 5); // HH:MM format

        // Insert into mcg_clocking_tbl
        const insertMcgQuery = `
          INSERT INTO mcg_clocking_tbl (
            terminal_id, finger_print_id, date_log, time_log, function_key,
            date_time, status_clock, insert_date
          )
          VALUES (
            @terminalId, @fingerPrintId, @dateLog, @timeLog, @functionKey,
            @dateTime, @statusClock, @insertDate
          )
        `;

        await orangePool.request()
          .input('terminalId', sql.NVarChar, terminalId)
          .input('fingerPrintId', sql.NVarChar, fingerPrintId)
          .input('dateLog', sql.DateTime, dateLog)
          .input('timeLog', sql.NVarChar, timeLog)
          .input('functionKey', sql.Int, functionKey)
          .input('dateTime', sql.DateTime, trDateTime)
          .input('statusClock', sql.NVarChar, 'NEW')
          .input('insertDate', sql.DateTime, new Date())
          .query(insertMcgQuery);

        // Update processed flag in tblAttendanceReport
        const updateProcessedQuery = `
          UPDATE tblAttendanceReport
          SET Processed = 1
          WHERE StaffNo = @staffNo AND TrDateTime = @trDateTime
        `;

        await mainPool.request()
          .input('staffNo', sql.NVarChar, record.StaffNo)
          .input('trDateTime', sql.DateTime, trDateTime)
          .query(updateProcessedQuery);

        console.log(`Inserted into mcg_clocking_tbl for ${record.StaffNo} at ${record.TrDateTime}`);
        return true;

      } finally {
        await orangePool.close();
      }

    } catch (error) {
      console.error(`Error inserting into mcg_clocking_tbl for ${record.StaffNo}:`, error);
      return false;
    }
  }

  /**
   * Process unprocessed records from tblAttendanceReport
   * @returns {Object} Processing results
   */
  async processUnprocessedRecords() {
    try {
      const pool = await poolPromise;
      
      // Get unprocessed records
      const query = `
        SELECT *
        FROM tblAttendanceReport
        WHERE Processed = 0 AND StaffNo LIKE 'MTI%'
        ORDER BY StaffNo, TrDateTime
      `;

      const result = await pool.request().query(query);
      const unprocessedRecords = result.recordset;

      console.log(`Found ${unprocessedRecords.length} unprocessed records`);

      let processedCount = 0;
      let errorCount = 0;

      for (const record of unprocessedRecords) {
        try {
          const success = await this.insertToMcgClockingTable(record);
          if (success) {
            processedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing record ${record.ID}:`, error);
          errorCount++;
        }
      }

      return {
        totalRecords: unprocessedRecords.length,
        processedCount,
        errorCount,
        success: errorCount === 0
      };

    } catch (error) {
      console.error('Error processing unprocessed records:', error);
      throw error;
    }
  }

  /**
   * Main report generation method (replaces Python main function)
   * @param {Object} params - Generation parameters
   * @returns {Object} Generation results
   */
  async generateReport(params) {
    try {
      const {
        startDateTime,
        endDateTime,
        insertToAttendanceReport = false,
        insertToMcgClocking = false,
        useFilo = false,
        manualTimes = null,
        controllerList = null
      } = params;

      console.log('Starting report generation...');
      
      const startTime = Date.now();
      
      // Process attendance data
      const processedRecords = await attendanceProcessingService.processAttendanceData({
        startDateTime,
        endDateTime,
        controllerList,
        useFilo,
        manualTimes
      });

      let insertedCount = 0;
      let skippedCount = 0;
      let mcgInsertedCount = 0;
      let mcgErrorCount = 0;

      // Insert to tblAttendanceReport if requested
      if (insertToAttendanceReport) {
        console.log('Inserting records to tblAttendanceReport...');
        
        for (const record of processedRecords) {
          const inserted = await this.insertToAttendanceReport(record);
          if (inserted) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      // Insert to mcg_clocking_tbl if requested
      if (insertToMcgClocking) {
        console.log('Inserting records to mcg_clocking_tbl...');
        
        for (const record of processedRecords) {
          const inserted = await this.insertToMcgClockingTable(record);
          if (inserted) {
            mcgInsertedCount++;
          } else {
            mcgErrorCount++;
          }
        }
      }

      const executionTime = Date.now() - startTime;

      // Log generation results
      await this.logReportGeneration({
        reportType: 'Attendance Report',
        startDate: startDateTime,
        endDate: endDateTime,
        recordsProcessed: processedRecords.length,
        recordsInserted: insertedCount,
        recordsSkipped: skippedCount,
        parameters: JSON.stringify(params),
        status: 'Success',
        executionTimeMs: executionTime
      });

      return {
        success: true,
        recordsProcessed: processedRecords.length,
        recordsInserted: insertedCount,
        recordsSkipped: skippedCount,
        mcgInsertedCount,
        mcgErrorCount,
        executionTimeMs: executionTime,
        data: processedRecords
      };

    } catch (error) {
      console.error('Error generating report:', error);
      
      // Log error
      await this.logReportGeneration({
        reportType: 'Attendance Report',
        startDate: params.startDateTime,
        endDate: params.endDateTime,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsSkipped: 0,
        parameters: JSON.stringify(params),
        status: 'Failed',
        errorMessage: error.message,
        executionTimeMs: 0
      });

      throw error;
    }
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @returns {string} CSV content
   */
  exportToCsv(data) {
    try {
      if (!data || data.length === 0) {
        return '';
      }

      // CSV headers
      const headers = [
        'CardNo', 'Name', 'Title', 'Position', 'Department', 'CardType',
        'Company', 'StaffNo', 'Transaction Date Time', 'Transaction Date',
        'Transaction Status', 'TrController', 'ClockEvent', 'UnitNo'
      ];

      // Convert data to CSV rows
      const csvRows = [headers.join(',')];
      
      data.forEach(record => {
        const row = [
          `"${record.CardNo || ''}"`,
          `"${record.Name || ''}"`,
          `"${record.Title || ''}"`,
          `"${record.Position || ''}"`,
          `"${record.Department || ''}"`,
          `"${record.CardType || ''}"`,
          `"${record.Company || ''}"`,
          record.StaffNo,
          new Date(record.TrDateTime).toISOString(),
          new Date(record.TrDateTime).toDateString(),
          `"${record.dtTransaction || ''}"`,
          `"${record.TrController}"`,
          record.ClockEvent,
          record.UnitNo || ''
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Log report generation activity
   * @param {Object} logData - Log data
   */
  async logReportGeneration(logData) {
    try {
      const pool = await poolPromise;
      
      const query = `
        INSERT INTO tblReportGenerationLog (
          ReportType, StartDate, EndDate, RecordsProcessed, RecordsInserted,
          RecordsSkipped, Parameters, Status, ErrorMessage, ExecutionTimeMs, CreatedBy
        )
        VALUES (
          @reportType, @startDate, @endDate, @recordsProcessed, @recordsInserted,
          @recordsSkipped, @parameters, @status, @errorMessage, @executionTimeMs, @createdBy
        )
      `;

      await pool.request()
        .input('reportType', sql.NVarChar, logData.reportType)
        .input('startDate', sql.DateTime, logData.startDate)
        .input('endDate', sql.DateTime, logData.endDate)
        .input('recordsProcessed', sql.Int, logData.recordsProcessed)
        .input('recordsInserted', sql.Int, logData.recordsInserted)
        .input('recordsSkipped', sql.Int, logData.recordsSkipped)
        .input('parameters', sql.NVarChar, logData.parameters)
        .input('status', sql.NVarChar, logData.status)
        .input('errorMessage', sql.NVarChar, logData.errorMessage || null)
        .input('executionTimeMs', sql.Int, logData.executionTimeMs)
        .input('createdBy', sql.NVarChar, 'System')
        .query(query);

    } catch (error) {
      console.error('Error logging report generation:', error);
      // Don't throw error here to avoid breaking the main process
    }
  }

  /**
   * Get report history
   * @param {Object} filters - Filter options
   * @returns {Array} Report history records
   */
  async getReportHistory(filters = {}) {
    try {
      const pool = await poolPromise;
      
      let whereClause = '';
      const conditions = [];
      
      if (filters.startDate && filters.endDate) {
        conditions.push('CreatedAt BETWEEN @startDate AND @endDate');
      }
      
      if (filters.status) {
        conditions.push('Status = @status');
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      const query = `
        SELECT *
        FROM tblReportGenerationLog
        ${whereClause}
        ORDER BY CreatedAt DESC
      `;

      const request = pool.request();
      
      if (filters.startDate && filters.endDate) {
        request.input('startDate', sql.DateTime, filters.startDate);
        request.input('endDate', sql.DateTime, filters.endDate);
      }
      
      if (filters.status) {
        request.input('status', sql.NVarChar, filters.status);
      }

      const result = await request.query(query);
      return result.recordset;

    } catch (error) {
      console.error('Error getting report history:', error);
      throw error;
    }
  }
}

module.exports = new ReportGenerationService();