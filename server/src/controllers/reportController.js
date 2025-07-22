const attendanceProcessingService = require('../services/attendanceProcessingService');
const reportGenerationService = require('../services/reportGenerationService');
const whatsappService = require('../services/whatsappService');
const { poolPromise, sql } = require('../config/db');

/**
 * Report Controller
 * Handles all report generation and management endpoints
 */
class ReportController {

  /**
   * Generate attendance report
   * POST /api/reports/generate
   */
  async generateReport(req, res) {
    try {
      const {
        startDateTime,
        endDateTime,
        controllerList = [],
        insertToAttendanceReport = true,
        insertToMcgClocking = false,
        useFilo = false,
        manualTimes = null,
        toleranceSeconds = 1800,
        whatsappChatId = null,
        sendWhatsApp = false
      } = req.body;

      // Validate required parameters
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      // Validate date range
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      // Generate report
      const reportResult = await reportGenerationService.generateReport({
        startDateTime,
        endDateTime,
        controllerList,
        insertToAttendanceReport,
        insertToMcgClocking,
        useFilo,
        manualTimes,
        toleranceSeconds
      });

      // Send WhatsApp if requested
      let whatsappResult = null;
      if (sendWhatsApp && reportResult.success) {
        whatsappResult = await whatsappService.sendReport({
          chatId: whatsappChatId,
          reportData: reportResult,
          originalParams: req.body,
          format: 'csv',
          includeFile: true
        });
      }

      res.json({
        success: reportResult.success,
        message: reportResult.message,
        data: {
          report: reportResult,
          whatsapp: whatsappResult
        }
      });

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Process unprocessed records
   * POST /api/reports/process-unprocessed
   */
  async processUnprocessedRecords(req, res) {
    try {
      const {
        batchSize = 1000,
        insertToMcgClocking = true
      } = req.body;

      const result = await reportGenerationService.processUnprocessedRecords({
        batchSize,
        insertToMcgClocking
      });

      res.json({
        success: true,
        message: 'Unprocessed records processed successfully',
        data: result
      });

    } catch (error) {
      console.error('Error processing unprocessed records:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get report statistics
   * GET /api/reports/statistics
   */
  async getStatistics(req, res) {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'date' // 'date', 'controller', 'status'
      } = req.query;

      const pool = await poolPromise;
      
      let query;
      let groupByClause;
      let selectClause;

      switch (groupBy) {
        case 'controller':
          selectClause = 'TrController as groupKey, COUNT(*) as recordCount';
          groupByClause = 'TrController';
          break;
        case 'status':
          selectClause = 'ClockEvent as groupKey, COUNT(*) as recordCount';
          groupByClause = 'ClockEvent';
          break;
        default: // date
          selectClause = 'CAST(TrDateTime as DATE) as groupKey, COUNT(*) as recordCount';
          groupByClause = 'CAST(TrDateTime as DATE)';
      }

      query = `
        SELECT ${selectClause}
        FROM tblAttendanceReport
        WHERE 1=1
      `;

      const request = pool.request();

      if (startDate) {
        query += ' AND TrDateTime >= @startDate';
        request.input('startDate', sql.DateTime, new Date(startDate));
      }

      if (endDate) {
        query += ' AND TrDateTime <= @endDate';
        request.input('endDate', sql.DateTime, new Date(endDate));
      }

      query += ` GROUP BY ${groupByClause} ORDER BY ${groupByClause}`;

      const result = await request.query(query);

      // Get overall statistics
      const overallQuery = `
        SELECT 
          COUNT(*) as totalRecords,
          COUNT(CASE WHEN Processed = 1 THEN 1 END) as processedRecords,
          COUNT(CASE WHEN Processed = 0 THEN 1 END) as unprocessedRecords,
          COUNT(DISTINCT StaffNo) as uniqueStaff,
          COUNT(DISTINCT TrController) as uniqueControllers
        FROM tblAttendanceReport
        WHERE 1=1
        ${startDate ? 'AND TrDateTime >= @startDate' : ''}
        ${endDate ? 'AND TrDateTime <= @endDate' : ''}
      `;

      const overallRequest = pool.request();
      if (startDate) overallRequest.input('startDate', sql.DateTime, new Date(startDate));
      if (endDate) overallRequest.input('endDate', sql.DateTime, new Date(endDate));

      const overallResult = await overallRequest.query(overallQuery);

      res.json({
        success: true,
        data: {
          groupedData: result.recordset,
          overall: overallResult.recordset[0],
          groupBy
        }
      });

    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Send report via WhatsApp
   * POST /api/reports/whatsapp/send
   */
  async sendWhatsAppReport(req, res) {
    try {
      const {
        chatId,
        startDateTime,
        endDateTime,
        format = 'csv',
        includeFile = true,
        controllerList = []
      } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID is required'
        });
      }

      // Get report data
      const reportData = await reportGenerationService.exportToCsv({
        startDateTime,
        endDateTime,
        controllerList
      });

      // Send via WhatsApp
      const result = await whatsappService.sendReport({
        chatId,
        reportData: {
          data: reportData.data,
          recordsProcessed: reportData.data.length,
          success: true
        },
        originalParams: req.body,
        format,
        includeFile
      });

      res.json(result);

    } catch (error) {
      console.error('Error sending WhatsApp report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Test WhatsApp connection
   * GET /api/reports/whatsapp/test
   */
  async testWhatsAppConnection(req, res) {
    try {
      const result = await whatsappService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get WhatsApp configuration
   * GET /api/reports/whatsapp/config
   */
  async getWhatsAppConfig(req, res) {
    try {
      const config = await whatsappService.getConfig();
      
      // Remove sensitive information
      const safeConfig = {
        enabled: config.enabled,
        timeout: config.timeout,
        maxFileSize: config.maxFileSize,
        hasApiUrl: !!config.apiUrl,
        hasDefaultChatId: !!config.defaultChatId
      };

      res.json({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      console.error('Error getting WhatsApp config:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update WhatsApp configuration
   * PUT /api/reports/whatsapp/config
   */
  async updateWhatsAppConfig(req, res) {
    try {
      const updates = req.body;
      
      // Validate allowed config keys
      const allowedKeys = ['API_URL', 'TIMEOUT_SECONDS', 'MAX_FILE_SIZE_MB', 'ENABLED', 'DEFAULT_CHAT_ID'];
      const filteredUpdates = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedKeys.includes(key)) {
          filteredUpdates[key] = value;
        }
      }

      await whatsappService.updateConfig(filteredUpdates);

      res.json({
        success: true,
        message: 'Configuration updated successfully'
      });

    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get report generation history
   * GET /api/reports/history
   */
  async getReportHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        status
      } = req.query;

      const pool = await poolPromise;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          Id, ReportType, Parameters, Status, ErrorMessage,
          WhatsAppSent, WhatsAppChatId, CreatedBy, CreatedAt
        FROM tblReportGenerationLog
        WHERE 1=1
      `;

      const request = pool.request();

      if (startDate) {
        query += ' AND CreatedAt >= @startDate';
        request.input('startDate', sql.DateTime, new Date(startDate));
      }

      if (endDate) {
        query += ' AND CreatedAt <= @endDate';
        request.input('endDate', sql.DateTime, new Date(endDate));
      }

      if (status) {
        query += ' AND Status = @status';
        request.input('status', sql.NVarChar, status);
      }

      query += ' ORDER BY CreatedAt DESC';
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, parseInt(limit));

      const result = await request.query(query);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM tblReportGenerationLog
        WHERE 1=1
      `;

      const countRequest = pool.request();

      if (startDate) {
        countQuery += ' AND CreatedAt >= @startDate';
        countRequest.input('startDate', sql.DateTime, new Date(startDate));
      }

      if (endDate) {
        countQuery += ' AND CreatedAt <= @endDate';
        countRequest.input('endDate', sql.DateTime, new Date(endDate));
      }

      if (status) {
        countQuery += ' AND Status = @status';
        countRequest.input('status', sql.NVarChar, status);
      }

      const countResult = await countRequest.query(countQuery);

      res.json({
        success: true,
        data: {
          records: result.recordset,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.recordset[0].total,
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting report history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get available controllers
   * GET /api/reports/controllers
   */
  async getControllers(req, res) {
    try {
      const pool = await poolPromise;
      
      const query = `
        SELECT DISTINCT TrController
        FROM tblTransaction
        WHERE TrController IS NOT NULL
        ORDER BY TrController
      `;

      const result = await pool.request().query(query);

      res.json({
        success: true,
        data: result.recordset.map(row => row.TrController)
      });

    } catch (error) {
      console.error('Error getting controllers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Export report data
   * GET /api/reports/export
   */
  async exportReport(req, res) {
    try {
      const {
        startDateTime,
        endDateTime,
        controllerList,
        format = 'csv'
      } = req.query;

      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const controllers = controllerList ? controllerList.split(',') : [];

      const result = await reportGenerationService.exportToCsv({
        startDateTime,
        endDateTime,
        controllerList: controllers
      });

      if (format === 'json') {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        // Return CSV
        const csvContent = whatsappService.generateCsvContent(result.data);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      }

    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new ReportController();