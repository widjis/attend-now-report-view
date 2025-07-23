const fs = require('fs').promises;
const path = require('path');
const { poolPromise, sql } = require('../config/db');

/**
 * WhatsApp Service
 * Handles WhatsApp integration for sending reports
 */
class WhatsAppService {
  constructor() {
    this.defaultConfig = {
      apiUrl: process.env.WHATSAPP_API_URL || 'http://10.60.10.46:8192/send-group-message',
      timeout: 30000,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      enabled: true
    };
  }

  /**
   * Get WhatsApp configuration from database
   * @returns {Object} WhatsApp configuration
   */
  async getConfig() {
    try {
      const pool = await poolPromise;
      
      const query = `
        SELECT ConfigKey, ConfigValue
        FROM [EmployeeWorkflow].[dbo].[tblWhatsAppConfig]
        WHERE IsActive = 1
      `;

      const result = await pool.request().query(query);
      
      const config = { ...this.defaultConfig };
      
      result.recordset.forEach(row => {
        switch (row.ConfigKey) {
          case 'API_URL':
            config.apiUrl = row.ConfigValue;
            break;
          case 'TIMEOUT_SECONDS':
            config.timeout = parseInt(row.ConfigValue) * 1000;
            break;
          case 'MAX_FILE_SIZE_MB':
            config.maxFileSize = parseInt(row.ConfigValue) * 1024 * 1024;
            break;
          case 'ENABLED':
            config.enabled = row.ConfigValue.toLowerCase() === 'true';
            break;
          case 'DEFAULT_CHAT_ID':
            config.defaultChatId = row.ConfigValue;
            break;
        }
      });

      return config;

    } catch (error) {
      console.error('Error getting WhatsApp config:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Test WhatsApp API connection
   * @returns {Object} Test result
   */
  async testConnection() {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          message: 'WhatsApp integration is disabled'
        };
      }

      // Simple ping test to the API endpoint
      const fetch = require('node-fetch');
      
      const response = await fetch(config.apiUrl, {
        method: 'GET',
        timeout: config.timeout
      });

      if (response.ok) {
        return {
          success: true,
          message: 'WhatsApp API is reachable',
          status: response.status
        };
      } else {
        return {
          success: false,
          message: `WhatsApp API returned status ${response.status}`,
          status: response.status
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Generate report message for WhatsApp
   * @param {Object} reportData - Report generation results
   * @param {Object} params - Original parameters
   * @returns {string} Formatted message
   */
  generateReportMessage(reportData, params) {
    const startDate = new Date(params.startDateTime).toLocaleDateString();
    const endDate = new Date(params.endDateTime).toLocaleDateString();
    
    let message = `📊 *Attendance Report Generated*\n\n`;
    message += `📅 *Period:* ${startDate} - ${endDate}\n`;
    message += `⏱️ *Generated:* ${new Date().toLocaleString()}\n\n`;
    
    message += `📈 *Summary:*\n`;
    message += `• Records Processed: ${reportData.recordsProcessed}\n`;
    
    if (params.insertToAttendanceReport) {
      message += `• Records Inserted: ${reportData.recordsInserted}\n`;
      message += `• Records Skipped: ${reportData.recordsSkipped}\n`;
    }
    
    if (params.insertToMcgClocking) {
      message += `• MCG Records: ${reportData.mcgInsertedCount}\n`;
      if (reportData.mcgErrorCount > 0) {
        message += `• MCG Errors: ${reportData.mcgErrorCount}\n`;
      }
    }
    
    message += `• Execution Time: ${(reportData.executionTimeMs / 1000).toFixed(2)}s\n\n`;
    
    if (params.useFilo) {
      message += `🔄 *FILO Logic Applied*\n`;
    }
    
    if (params.manualTimes) {
      message += `⏰ *Manual Times:* ${params.manualTimes.timeIn} - ${params.manualTimes.timeOut}\n`;
    }
    
    if (params.controllerList && params.controllerList.length > 0) {
      message += `🎛️ *Controllers:* ${params.controllerList.length} selected\n`;
    }
    
    message += `\n✅ *Status:* ${reportData.success ? 'Success' : 'Completed with warnings'}`;
    
    return message;
  }

  /**
   * Create temporary file for sending
   * @param {string} content - File content
   * @param {string} filename - File name
   * @returns {string} File path
   */
  async createTempFile(content, filename) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      
      // Ensure temp directory exists
      try {
        await fs.access(tempDir);
      } catch {
        await fs.mkdir(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      
      return filePath;

    } catch (error) {
      console.error('Error creating temp file:', error);
      throw error;
    }
  }

  /**
   * Delete temporary file
   * @param {string} filePath - File path to delete
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting temp file:', error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Send report via WhatsApp
   * @param {Object} params - Send parameters
   * @returns {Object} Send result
   */
  async sendReport(params) {
    try {
      const {
        chatId,
        reportData,
        originalParams,
        format = 'csv', // 'csv' or 'json'
        includeFile = true
      } = params;

      const config = await this.getConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          message: 'WhatsApp integration is disabled'
        };
      }

      const actualChatId = chatId || config.defaultChatId;
      
      if (!actualChatId) {
        return {
          success: false,
          message: 'No chat ID provided and no default chat ID configured'
        };
      }

      // Generate message
      const message = this.generateReportMessage(reportData, originalParams);
      
      let filePath = null;
      
      try {
        // Create file if requested
        if (includeFile && reportData.data && reportData.data.length > 0) {
          let content;
          let filename;
          
          if (format === 'csv') {
            content = this.generateCsvContent(reportData.data);
            filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            content = JSON.stringify(reportData.data, null, 2);
            filename = `attendance_report_${new Date().toISOString().split('T')[0]}.json`;
          }
          
          filePath = await this.createTempFile(content, filename);
          
          // Check file size
          const stats = await fs.stat(filePath);
          if (stats.size > config.maxFileSize) {
            await this.deleteTempFile(filePath);
            return {
              success: false,
              message: `File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${config.maxFileSize / 1024 / 1024}MB)`
            };
          }
        }

        // Send via WhatsApp API
        const fetch = require('node-fetch');
        const FormData = require('form-data');
        
        const formData = new FormData();
        formData.append('chat_id', actualChatId);
        formData.append('message', message);
        
        if (filePath) {
          const fileBuffer = await fs.readFile(filePath);
          formData.append('file', fileBuffer, path.basename(filePath));
        }

        const response = await fetch(config.apiUrl, {
          method: 'POST',
          body: formData,
          timeout: config.timeout
        });

        const responseData = await response.json();

        if (response.ok) {
          // Log successful send
          await this.logWhatsAppSend({
            chatId: actualChatId,
            message: message.substring(0, 500), // Truncate for storage
            fileIncluded: !!filePath,
            status: 'Success',
            response: JSON.stringify(responseData)
          });

          return {
            success: true,
            message: 'Report sent successfully',
            response: responseData
          };
        } else {
          throw new Error(`API returned ${response.status}: ${responseData.message || 'Unknown error'}`);
        }

      } finally {
        // Clean up temp file
        if (filePath) {
          await this.deleteTempFile(filePath);
        }
      }

    } catch (error) {
      console.error('Error sending WhatsApp report:', error);
      
      // Log failed send
      await this.logWhatsAppSend({
        chatId: params.chatId || 'unknown',
        message: 'Failed to send',
        fileIncluded: false,
        status: 'Failed',
        errorMessage: error.message
      });

      return {
        success: false,
        message: `Failed to send report: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Generate CSV content from data
   * @param {Array} data - Data to convert
   * @returns {string} CSV content
   */
  generateCsvContent(data) {
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
          `"${(record.CardNo || '').replace(/"/g, '""')}"`,
          `"${(record.Name || '').replace(/"/g, '""')}"`,
          `"${(record.Title || '').replace(/"/g, '""')}"`,
          `"${(record.Position || '').replace(/"/g, '""')}"`,
          `"${(record.Department || '').replace(/"/g, '""')}"`,
          `"${(record.CardType || '').replace(/"/g, '""')}"`,
          `"${(record.Company || '').replace(/"/g, '""')}"`,
          record.StaffNo || '',
          new Date(record.TrDateTime).toISOString(),
          new Date(record.TrDateTime).toDateString(),
          `"${(record.dtTransaction || '').replace(/"/g, '""')}"`,
          `"${(record.TrController || '').replace(/"/g, '""')}"`,
          record.ClockEvent || '',
          record.UnitNo || ''
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');

    } catch (error) {
      console.error('Error generating CSV content:', error);
      throw error;
    }
  }

  /**
   * Log WhatsApp send activity
   * @param {Object} logData - Log data
   */
  async logWhatsAppSend(logData) {
    try {
      const pool = await poolPromise;
      
      const query = `
        INSERT INTO tblReportGenerationLog (
          ReportType, Parameters, Status, ErrorMessage, WhatsAppSent, WhatsAppChatId, CreatedBy
        )
        VALUES (
          @reportType, @parameters, @status, @errorMessage, @whatsAppSent, @whatsAppChatId, @createdBy
        )
      `;

      await pool.request()
        .input('reportType', sql.NVarChar, 'WhatsApp Send')
        .input('parameters', sql.NVarChar, JSON.stringify(logData))
        .input('status', sql.NVarChar, logData.status)
        .input('errorMessage', sql.NVarChar, logData.errorMessage || null)
        .input('whatsAppSent', sql.Bit, logData.status === 'Success')
        .input('whatsAppChatId', sql.NVarChar, logData.chatId)
        .input('createdBy', sql.NVarChar, 'System')
        .query(query);

    } catch (error) {
      console.error('Error logging WhatsApp send:', error);
      // Don't throw error here to avoid breaking the main process
    }
  }

  /**
   * Update WhatsApp configuration
   * @param {Object} configUpdates - Configuration updates
   * @returns {boolean} Success status
   */
  async updateConfig(configUpdates) {
    try {
      const pool = await poolPromise;
      
      for (const [key, value] of Object.entries(configUpdates)) {
        const query = `
          UPDATE [EmployeeWorkflow].[dbo].[tblWhatsAppConfig]
          SET ConfigValue = @value, UpdatedAt = GETDATE()
          WHERE ConfigKey = @key
        `;

        await pool.request()
          .input('key', sql.NVarChar, key)
          .input('value', sql.NVarChar, value.toString())
          .query(query);
      }

      return true;

    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();