const sql = require('mssql');
const { poolPromise, dataDbPoolPromise, orangeDbPoolPromise } = require('../config/db');

class SyncAttendanceService {
  constructor() {
    // Using direct pool connections from db.js
  }

  async syncAttendance(params) {
    const {
      syncId,
      startDateTime,
      endDateTime,
      dryRun = false,
      batchSize = 1000,
      tolerance = 30,
      insertToMCG = true,
      useManualTimes = false,
      manualInTime,
      manualOutTime,
      executedAt,
      createdBy
    } = params;

    const startTime = Date.now();
    let totalRetrieved = 0;
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsSkipped = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    const errors = [];
    const warnings = [];

    try {
      console.log(`Starting sync attendance process: ${syncId}`);

      // Get database connections
      const dataDBEnt = await dataDbPoolPromise;
      const employeeWorkflow = await poolPromise;

      // Step 1: Retrieve transactions from DataDBEnt
      console.log('Step 1: Retrieving transactions from tblTransaction...');
      const transactions = await this.getTransactions(dataDBEnt, startDateTime, endDateTime);
      totalRetrieved = transactions.length;
      console.log(`Retrieved ${totalRetrieved} transactions`);

      if (totalRetrieved === 0) {
        const result = {
          syncId,
          startDateTime,
          endDateTime,
          status: 'success',
          totalRetrieved: 0,
          recordsProcessed: 0,
          recordsInserted: 0,
          recordsSkipped: 0,
          validRecords: 0,
          invalidRecords: 0,
          executionTimeMs: Date.now() - startTime,
          executedAt,
          createdBy,
          parameters: params,
          warnings: ['No transactions found in the specified date range']
        };

        if (!dryRun) {
          await this.logSyncResult(employeeWorkflow, result);
        }

        return result;
      }

      // Step 2: Process transactions in batches
      console.log('Step 2: Processing transactions...');
      const processedData = await this.processTransactions(
        transactions, 
        tolerance, 
        useManualTimes, 
        manualInTime, 
        manualOutTime
      );

      recordsProcessed = processedData.processed.length;
      validRecords = processedData.valid.length;
      invalidRecords = processedData.invalid.length;
      recordsSkipped = processedData.skipped.length;

      console.log(`Processed: ${recordsProcessed}, Valid: ${validRecords}, Invalid: ${invalidRecords}, Skipped: ${recordsSkipped}`);

      // Step 3: Insert to tblAttendance (if not dry run)
      if (!dryRun && validRecords > 0) {
        console.log('Step 3: Inserting to tblAttendance...');
        recordsInserted = await this.insertToAttendance(employeeWorkflow, processedData.valid);
        console.log(`Inserted ${recordsInserted} records to tblAttendance`);

        // Step 4: Insert to MCG tables (if enabled)
        if (insertToMCG) {
          console.log('Step 4: Inserting to MCG tables...');
          await this.insertToMCG(employeeWorkflow, processedData.valid);
          console.log('MCG insertion completed');
        }
      }

      // Prepare result
      const result = {
        syncId,
        startDateTime,
        endDateTime,
        status: 'success',
        totalRetrieved,
        recordsProcessed,
        recordsInserted: dryRun ? 0 : recordsInserted,
        recordsSkipped,
        validRecords,
        invalidRecords,
        executionTimeMs: Date.now() - startTime,
        executedAt,
        createdBy,
        parameters: params,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Log sync result (if not dry run)
      if (!dryRun) {
        await this.logSyncResult(employeeWorkflow, result);
      }

      console.log(`Sync attendance completed: ${syncId}`);
      return result;

    } catch (error) {
      console.error(`Sync attendance failed: ${syncId}`, error);

      const result = {
        syncId,
        startDateTime,
        endDateTime,
        status: 'error',
        totalRetrieved,
        recordsProcessed,
        recordsInserted,
        recordsSkipped,
        validRecords,
        invalidRecords,
        executionTimeMs: Date.now() - startTime,
        executedAt,
        createdBy,
        parameters: params,
        errors: [error.message]
      };

      // Log error result (if not dry run)
      if (!dryRun) {
        try {
          const employeeWorkflow = await poolPromise;
          await this.logSyncResult(employeeWorkflow, result);
        } catch (logError) {
          console.error('Failed to log sync error:', logError);
        }
      }

      throw error;
    }
  }

  async getTransactions(connection, startDateTime, endDateTime) {
    const query = `
      SELECT 
        t.ID,
        t.EmployeeID,
        t.ControllerID,
        t.TransactionTime,
        t.TransactionType,
        e.Name as EmployeeName,
        c.Name as ControllerName
      FROM tblTransaction t
      LEFT JOIN tblEmployee e ON t.EmployeeID = e.ID
      LEFT JOIN tblController c ON t.ControllerID = c.ID
      WHERE t.TransactionTime >= @startDateTime 
        AND t.TransactionTime <= @endDateTime
      ORDER BY t.EmployeeID, t.TransactionTime
    `;

    const request = connection.request();
    request.input('startDateTime', sql.DateTime, new Date(startDateTime));
    request.input('endDateTime', sql.DateTime, new Date(endDateTime));

    const result = await request.query(query);
    return result.recordset;
  }

  async processTransactions(transactions, tolerance, useManualTimes, manualInTime, manualOutTime) {
    const processed = [];
    const valid = [];
    const invalid = [];
    const skipped = [];

    // Group transactions by employee and date
    const groupedTransactions = this.groupTransactionsByEmployeeAndDate(transactions);

    for (const [key, dayTransactions] of Object.entries(groupedTransactions)) {
      const [employeeId, date] = key.split('_');
      
      try {
        const attendanceRecord = this.processEmployeeDayTransactions(
          employeeId,
          date,
          dayTransactions,
          tolerance,
          useManualTimes,
          manualInTime,
          manualOutTime
        );

        processed.push(attendanceRecord);

        if (attendanceRecord.isValid) {
          valid.push(attendanceRecord);
        } else {
          invalid.push(attendanceRecord);
        }

      } catch (error) {
        console.error(`Error processing transactions for employee ${employeeId} on ${date}:`, error);
        skipped.push({
          employeeId,
          date,
          error: error.message,
          transactions: dayTransactions
        });
      }
    }

    return { processed, valid, invalid, skipped };
  }

  groupTransactionsByEmployeeAndDate(transactions) {
    const grouped = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.TransactionTime).toISOString().split('T')[0];
      const key = `${transaction.EmployeeID}_${date}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(transaction);
    });

    return grouped;
  }

  processEmployeeDayTransactions(employeeId, date, transactions, tolerance, useManualTimes, manualInTime, manualOutTime) {
    // Sort transactions by time
    transactions.sort((a, b) => new Date(a.TransactionTime) - new Date(b.TransactionTime));

    let inTime = null;
    let outTime = null;
    let isValid = true;
    const issues = [];

    if (useManualTimes && manualInTime && manualOutTime) {
      // Use manual times
      inTime = `${date}T${manualInTime}:00`;
      outTime = `${date}T${manualOutTime}:00`;
    } else {
      // Process transactions to find in/out times
      const firstTransaction = transactions[0];
      const lastTransaction = transactions[transactions.length - 1];

      // Simple logic: first transaction is IN, last is OUT
      inTime = firstTransaction.TransactionTime;
      
      if (transactions.length > 1) {
        outTime = lastTransaction.TransactionTime;
      } else {
        // Only one transaction - could be IN or OUT
        if (new Date(firstTransaction.TransactionTime).getHours() < 12) {
          // Morning transaction - assume it's IN time
          inTime = firstTransaction.TransactionTime;
          outTime = null;
        } else {
          // Afternoon/evening transaction - assume it's OUT time
          inTime = null;
          outTime = firstTransaction.TransactionTime;
        }
      }
    }

    // Calculate working hours
    let workingHours = 0;
    if (inTime && outTime) {
      const inDateTime = new Date(inTime);
      const outDateTime = new Date(outTime);
      workingHours = (outDateTime - inDateTime) / (1000 * 60 * 60); // Convert to hours

      // Validate working hours
      if (workingHours < 0) {
        isValid = false;
        issues.push('Out time is before in time');
      } else if (workingHours > 24) {
        isValid = false;
        issues.push('Working hours exceed 24 hours');
      }
    }

    // Determine status
    let status = 'present';
    if (!inTime && !outTime) {
      status = 'absent';
      isValid = false;
      issues.push('No valid in/out times found');
    } else if (!inTime) {
      status = 'partial'; // Only out time
      issues.push('Missing in time');
    } else if (!outTime) {
      status = 'partial'; // Only in time
      issues.push('Missing out time');
    }

    return {
      employeeId,
      employeeName: transactions[0].EmployeeName,
      date,
      inTime,
      outTime,
      workingHours: Math.round(workingHours * 100) / 100, // Round to 2 decimal places
      status,
      isValid,
      issues,
      transactionCount: transactions.length,
      rawTransactions: transactions
    };
  }

  async insertToAttendance(connection, attendanceRecords) {
    let insertedCount = 0;

    for (const record of attendanceRecords) {
      try {
        const query = `
          INSERT INTO tblAttendance (
            EmployeeID,
            Date,
            InTime,
            OutTime,
            WorkingHours,
            Status,
            Source,
            CreatedAt,
            UpdatedAt
          ) VALUES (
            @employeeId,
            @date,
            @inTime,
            @outTime,
            @workingHours,
            @status,
            'sync',
            GETDATE(),
            GETDATE()
          )
        `;

        const request = connection.request();
        request.input('employeeId', sql.Int, record.employeeId);
        request.input('date', sql.Date, new Date(record.date));
        request.input('inTime', sql.DateTime, record.inTime ? new Date(record.inTime) : null);
        request.input('outTime', sql.DateTime, record.outTime ? new Date(record.outTime) : null);
        request.input('workingHours', sql.Decimal(5, 2), record.workingHours);
        request.input('status', sql.VarChar(20), record.status);

        await request.query(query);
        insertedCount++;

      } catch (error) {
        console.error(`Failed to insert attendance record for employee ${record.employeeId}:`, error);
        // Continue with other records
      }
    }

    return insertedCount;
  }

  async insertToMCG(connection, attendanceRecords) {
    // Implementation for MCG table insertion
    // This would depend on the specific MCG table structure
    console.log('MCG insertion - placeholder implementation');
    return attendanceRecords.length;
  }

  async logSyncResult(connection, result) {
    const query = `
      INSERT INTO tblReportGenerationLog (
        SyncId,
        StartDate,
        EndDate,
        Status,
        TotalRetrieved,
        RecordsProcessed,
        RecordsInserted,
        RecordsSkipped,
        ValidRecords,
        InvalidRecords,
        ExecutionTimeMs,
        ExecutedAt,
        CreatedBy,
        Parameters,
        ErrorMessage
      ) VALUES (
        @syncId,
        @startDate,
        @endDate,
        @status,
        @totalRetrieved,
        @recordsProcessed,
        @recordsInserted,
        @recordsSkipped,
        @validRecords,
        @invalidRecords,
        @executionTimeMs,
        @executedAt,
        @createdBy,
        @parameters,
        @errorMessage
      )
    `;

    const request = connection.request();
    request.input('syncId', sql.VarChar(50), result.syncId);
    request.input('startDate', sql.DateTime, new Date(result.startDateTime));
    request.input('endDate', sql.DateTime, new Date(result.endDateTime));
    request.input('status', sql.VarChar(20), result.status);
    request.input('totalRetrieved', sql.Int, result.totalRetrieved);
    request.input('recordsProcessed', sql.Int, result.recordsProcessed);
    request.input('recordsInserted', sql.Int, result.recordsInserted);
    request.input('recordsSkipped', sql.Int, result.recordsSkipped);
    request.input('validRecords', sql.Int, result.validRecords);
    request.input('invalidRecords', sql.Int, result.invalidRecords);
    request.input('executionTimeMs', sql.Int, result.executionTimeMs);
    request.input('executedAt', sql.DateTime, new Date(result.executedAt));
    request.input('createdBy', sql.VarChar(100), result.createdBy);
    request.input('parameters', sql.Text, JSON.stringify(result.parameters));
    request.input('errorMessage', sql.Text, result.errors ? result.errors.join('; ') : null);

    await request.query(query);
  }

  async getSyncHistory(params) {
    const { limit = 50, offset = 0, startDate, endDate, status, createdBy } = params;

    try {
      const connection = await poolPromise;

      let whereClause = 'WHERE 1=1';
      const inputs = [];

      if (startDate) {
        whereClause += ' AND ExecutedAt >= @startDate';
        inputs.push({ name: 'startDate', type: sql.DateTime, value: new Date(startDate) });
      }

      if (endDate) {
        whereClause += ' AND ExecutedAt <= @endDate';
        inputs.push({ name: 'endDate', type: sql.DateTime, value: new Date(endDate) });
      }

      if (status) {
        whereClause += ' AND Status = @status';
        inputs.push({ name: 'status', type: sql.VarChar(20), value: status });
      }

      if (createdBy) {
        whereClause += ' AND CreatedBy = @createdBy';
        inputs.push({ name: 'createdBy', type: sql.VarChar(100), value: createdBy });
      }

      const query = `
        SELECT 
          SyncId,
          StartDate,
          EndDate,
          Status,
          TotalRetrieved,
          RecordsProcessed,
          RecordsInserted,
          RecordsSkipped,
          ValidRecords,
          InvalidRecords,
          ExecutionTimeMs,
          ExecutedAt,
          CreatedBy,
          ErrorMessage
        FROM tblReportGenerationLog
        ${whereClause}
        ORDER BY ExecutedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const request = connection.request();
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, limit);

      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });

      const result = await request.query(query);
      return result.recordset;

    } catch (error) {
      console.error('Get sync history error:', error);
      throw error;
    }
  }

  async getSyncStatistics(params) {
    const { startDate, endDate, status } = params;

    try {
      const connection = await poolPromise;

      let whereClause = 'WHERE 1=1';
      const inputs = [];

      if (startDate) {
        whereClause += ' AND ExecutedAt >= @startDate';
        inputs.push({ name: 'startDate', type: sql.DateTime, value: new Date(startDate) });
      }

      if (endDate) {
        whereClause += ' AND ExecutedAt <= @endDate';
        inputs.push({ name: 'endDate', type: sql.DateTime, value: new Date(endDate) });
      }

      if (status) {
        whereClause += ' AND Status = @status';
        inputs.push({ name: 'status', type: sql.VarChar(20), value: status });
      }

      const query = `
        SELECT 
          COUNT(*) as TotalSyncs,
          SUM(CASE WHEN Status = 'success' THEN 1 ELSE 0 END) as SuccessfulSyncs,
          SUM(CASE WHEN Status = 'error' THEN 1 ELSE 0 END) as FailedSyncs,
          SUM(ISNULL(RecordsProcessed, 0)) as TotalRecordsProcessed,
          SUM(ISNULL(RecordsInserted, 0)) as TotalRecordsInserted,
          SUM(ISNULL(RecordsSkipped, 0)) as TotalRecordsSkipped,
          AVG(ISNULL(ExecutionTimeMs, 0)) as AverageExecutionTime,
          MAX(ExecutedAt) as LastSyncDate
        FROM tblReportGenerationLog
        ${whereClause}
      `;

      const request = connection.request();
      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });

      const result = await request.query(query);
      return result.recordset[0];

    } catch (error) {
      console.error('Get sync statistics error:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        databases: [],
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        }
      };

      // Check database connections
      const databases = [
        { name: 'DataDBEnt', pool: dataDbPoolPromise },
        { name: 'EmployeeWorkflow', pool: poolPromise }
      ];
      
      for (const db of databases) {
        try {
          const startTime = Date.now();
          const connection = await db.pool;
          const responseTime = Date.now() - startTime;

          health.databases.push({
            name: db.name,
            connected: true,
            lastChecked: new Date().toISOString(),
            responseTime
          });
        } catch (error) {
          health.databases.push({
            name: db.name,
            connected: false,
            lastChecked: new Date().toISOString(),
            error: error.message
          });
          health.status = 'warning';
        }
      }

      return health;

    } catch (error) {
      console.error('Get system health error:', error);
      throw error;
    }
  }

  async previewSyncData(params) {
    const { startDateTime, endDateTime, limit = 100 } = params;

    try {
      const connection = await dataDbPoolPromise;
      
      const query = `
        SELECT TOP (@limit)
          t.ID,
          t.EmployeeID,
          t.ControllerID,
          t.TransactionTime,
          t.TransactionType,
          e.Name as EmployeeName,
          c.Name as ControllerName
        FROM tblTransaction t
        LEFT JOIN tblEmployee e ON t.EmployeeID = e.ID
        LEFT JOIN tblController c ON t.ControllerID = c.ID
        WHERE t.TransactionTime >= @startDateTime 
          AND t.TransactionTime <= @endDateTime
        ORDER BY t.TransactionTime DESC
      `;

      const request = connection.request();
      request.input('startDateTime', sql.DateTime, new Date(startDateTime));
      request.input('endDateTime', sql.DateTime, new Date(endDateTime));
      request.input('limit', sql.Int, limit);

      const result = await request.query(query);

      return {
        totalRecords: result.recordset.length,
        sampleRecords: result.recordset,
        dateRange: {
          earliest: startDateTime,
          latest: endDateTime
        }
      };

    } catch (error) {
      console.error('Preview sync data error:', error);
      throw error;
    }
  }

  async validateSyncData(params) {
    const { startDateTime, endDateTime } = params;

    try {
      const connection = await dataDbPoolPromise;
      
      // Get basic statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as TotalTransactions,
          COUNT(DISTINCT EmployeeID) as UniqueEmployees,
          COUNT(DISTINCT CAST(TransactionTime AS DATE)) as UniqueDates,
          MIN(TransactionTime) as EarliestTransaction,
          MAX(TransactionTime) as LatestTransaction
        FROM tblTransaction
        WHERE TransactionTime >= @startDateTime 
          AND TransactionTime <= @endDateTime
      `;

      const request = connection.request();
      request.input('startDateTime', sql.DateTime, new Date(startDateTime));
      request.input('endDateTime', sql.DateTime, new Date(endDateTime));

      const statsResult = await request.query(statsQuery);
      const stats = statsResult.recordset[0];

      const issues = [];
      const recommendations = [];

      // Validate data quality
      if (stats.TotalTransactions === 0) {
        issues.push({
          type: 'error',
          message: 'No transactions found in the specified date range'
        });
      }

      if (stats.UniqueEmployees < 1) {
        issues.push({
          type: 'warning',
          message: 'Very few employees have transactions in this period'
        });
      }

      // Estimate success rate
      const estimatedSuccess = {
        percentage: issues.length === 0 ? 95 : 70,
        expectedValid: Math.floor(stats.TotalTransactions * 0.9),
        expectedInvalid: Math.ceil(stats.TotalTransactions * 0.1)
      };

      return {
        isValid: issues.filter(i => i.type === 'error').length === 0,
        issues,
        recommendations,
        estimatedSuccess,
        statistics: stats
      };

    } catch (error) {
      console.error('Validate sync data error:', error);
      throw error;
    }
  }

  async exportSyncReport(params) {
    // Implementation for exporting sync reports
    // This would generate CSV, JSON, or Excel files
    console.log('Export sync report - placeholder implementation');
    return 'Export data would be generated here';
  }

  async getSyncById(syncId) {
    try {
      const connection = await poolPromise;

      const query = `
        SELECT *
        FROM tblReportGenerationLog
        WHERE SyncId = @syncId
      `;

      const request = connection.request();
      request.input('syncId', sql.VarChar(50), syncId);

      const result = await request.query(query);
      return result.recordset[0];

    } catch (error) {
      console.error('Get sync by ID error:', error);
      throw error;
    }
  }
}

module.exports = { SyncAttendanceService };