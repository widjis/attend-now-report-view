const { SyncAttendanceService } = require('../services/syncAttendanceService');
const whatsappService = require('../services/whatsappService');
const { SchedulerService } = require('../services/schedulerService');
const { v4: uuidv4 } = require('uuid');

class SyncController {
  constructor() {
    this.syncService = new SyncAttendanceService();
    this.whatsappService = whatsappService;
    this.schedulerService = new SchedulerService();
  }

  // Manual sync attendance
  async syncAttendance(req, res) {
    try {
      const {
        startDateTime,
        endDateTime,
        sendWhatsApp = false,
        whatsappChatId,
        dryRun = false,
        batchSize = 1000,
        tolerance = 30,
        insertToMCG = true,
        useManualTimes = false,
        manualInTime,
        manualOutTime
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

      // Generate sync ID
      const syncId = uuidv4();
      const executedAt = new Date().toISOString();
      const createdBy = req.user?.username || 'system';

      // Prepare sync parameters
      const syncParams = {
        syncId,
        startDateTime,
        endDateTime,
        dryRun,
        batchSize,
        tolerance,
        insertToMCG,
        useManualTimes,
        manualInTime,
        manualOutTime,
        executedAt,
        createdBy
      };

      console.log(`Starting attendance sync: ${syncId}`);
      console.log(`Date range: ${startDateTime} to ${endDateTime}`);
      console.log(`Parameters:`, { dryRun, batchSize, tolerance, insertToMCG });

      // Execute sync
      const result = await this.syncService.syncAttendance(syncParams);

      // Send WhatsApp notification if requested
      let whatsappResult = null;
      if (sendWhatsApp && !dryRun) {
        try {
          const chatId = whatsappChatId || process.env.WHATSAPP_DEFAULT_CHAT_ID;
          if (chatId) {
            whatsappResult = await this.whatsappService.sendSyncReport(result, chatId);
          }
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
          whatsappResult = {
            success: false,
            message: whatsappError.message
          };
        }
      }

      // Prepare response
      const response = {
        success: true,
        message: dryRun ? 'Dry run completed successfully' : 'Attendance sync completed successfully',
        data: {
          ...result,
          whatsapp: whatsappResult
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Sync attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync attendance',
        error: error.message
      });
    }
  }

  // Get sync history
  async getSyncHistory(req, res) {
    try {
      const {
        limit = 50,
        offset = 0,
        startDate,
        endDate,
        status,
        createdBy
      } = req.query;

      const history = await this.syncService.getSyncHistory({
        limit: parseInt(limit),
        offset: parseInt(offset),
        startDate,
        endDate,
        status,
        createdBy
      });

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Get sync history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sync history',
        error: error.message
      });
    }
  }

  // Get sync statistics
  async getSyncStatistics(req, res) {
    try {
      const { startDate, endDate, status } = req.query;

      const statistics = await this.syncService.getSyncStatistics({
        startDate,
        endDate,
        status
      });

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Get sync statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sync statistics',
        error: error.message
      });
    }
  }

  // Get sync schedule
  async getSyncSchedule(req, res) {
    try {
      const schedule = await this.schedulerService.getSchedule();
      
      res.json({
        success: true,
        data: schedule
      });

    } catch (error) {
      console.error('Get sync schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sync schedule',
        error: error.message
      });
    }
  }

  // Update sync schedule
  async updateSyncSchedule(req, res) {
    try {
      const schedule = req.body;

      // Validate schedule format
      if (!schedule || typeof schedule.enabled !== 'boolean' || !Array.isArray(schedule.schedules)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid schedule format'
        });
      }

      const updatedSchedule = await this.schedulerService.updateSchedule(schedule);

      res.json({
        success: true,
        message: 'Schedule updated successfully',
        data: updatedSchedule
      });

    } catch (error) {
      console.error('Update sync schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sync schedule',
        error: error.message
      });
    }
  }

  // Toggle schedule enabled/disabled
  async toggleSchedule(req, res) {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Enabled parameter must be boolean'
        });
      }

      await this.schedulerService.toggleSchedule(enabled);

      res.json({
        success: true,
        message: `Schedule ${enabled ? 'enabled' : 'disabled'} successfully`
      });

    } catch (error) {
      console.error('Toggle schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle schedule',
        error: error.message
      });
    }
  }

  // Test WhatsApp connection
  async testWhatsAppConnection(req, res) {
    try {
      const result = await this.whatsappService.testConnection();

      res.json({
        success: true,
        message: 'WhatsApp connection test completed',
        data: result
      });

    } catch (error) {
      console.error('WhatsApp test error:', error);
      res.status(500).json({
        success: false,
        message: 'WhatsApp connection test failed',
        error: error.message
      });
    }
  }

  // Send sync report via WhatsApp
  async sendSyncReport(req, res) {
    try {
      const { syncId, chatId } = req.body;

      if (!syncId) {
        return res.status(400).json({
          success: false,
          message: 'Sync ID is required'
        });
      }

      // Get sync result
      const syncResult = await this.syncService.getSyncById(syncId);
      if (!syncResult) {
        return res.status(404).json({
          success: false,
          message: 'Sync record not found'
        });
      }

      // Send WhatsApp report
      const targetChatId = chatId || process.env.WHATSAPP_DEFAULT_CHAT_ID;
      const result = await this.whatsappService.sendSyncReport(syncResult, targetChatId);

      res.json({
        success: true,
        message: 'WhatsApp report sent successfully',
        data: result
      });

    } catch (error) {
      console.error('Send WhatsApp report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send WhatsApp report',
        error: error.message
      });
    }
  }

  // Get system health
  async getSystemHealth(req, res) {
    try {
      const health = await this.syncService.getSystemHealth();

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system health',
        error: error.message
      });
    }
  }

  // Preview sync data
  async previewSyncData(req, res) {
    try {
      const { startDateTime, endDateTime, limit = 100 } = req.body;

      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const preview = await this.syncService.previewSyncData({
        startDateTime,
        endDateTime,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: preview
      });

    } catch (error) {
      console.error('Preview sync data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview sync data',
        error: error.message
      });
    }
  }

  // Validate sync data
  async validateSyncData(req, res) {
    try {
      const { startDateTime, endDateTime } = req.body;

      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const validation = await this.syncService.validateSyncData({
        startDateTime,
        endDateTime
      });

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      console.error('Validate sync data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate sync data',
        error: error.message
      });
    }
  }

  // Export sync report
  async exportSyncReport(req, res) {
    try {
      const { syncId, startDate, endDate, format = 'csv' } = req.query;

      const exportData = await this.syncService.exportSyncReport({
        syncId,
        startDate,
        endDate,
        format
      });

      // Set appropriate headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `sync-report-${timestamp}.${format}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', this.getContentType(format));

      res.send(exportData);

    } catch (error) {
      console.error('Export sync report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export sync report',
        error: error.message
      });
    }
  }

  // Helper method to get content type for export
  getContentType(format) {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}

module.exports = { SyncController };