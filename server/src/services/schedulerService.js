const cron = require('node-cron');
const { SyncAttendanceService } = require('./syncAttendanceService');
const whatsappService = require('./whatsappService');
const { v4: uuidv4 } = require('uuid');

class SchedulerService {
  constructor() {
    this.syncService = new SyncAttendanceService();
    this.whatsappService = whatsappService;
    this.scheduledJobs = new Map();
    this.defaultSchedule = {
      enabled: true,
      schedules: [
        {
          time: '01:00',
          enabled: true,
          description: 'Daily sync at 1:00 AM',
          timezone: 'Asia/Jakarta'
        },
        {
          time: '13:00',
          enabled: true,
          description: 'Daily sync at 1:00 PM',
          timezone: 'Asia/Jakarta'
        }
      ],
      defaultParams: {
        sendWhatsApp: true,
        insertToMCG: true,
        tolerance: 30,
        batchSize: 1000
      },
      notifications: {
        whatsapp: {
          enabled: true
        }
      }
    };
    
    this.currentSchedule = { ...this.defaultSchedule };
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing Scheduler Service...');
    
    try {
      // Load schedule from database or use default
      await this.loadScheduleFromDatabase();
      
      // Start scheduled jobs if enabled
      if (this.currentSchedule.enabled) {
        await this.startScheduledJobs();
      }
      
      this.isInitialized = true;
      console.log('Scheduler Service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Scheduler Service:', error);
      throw error;
    }
  }

  async loadScheduleFromDatabase() {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll use the default schedule
      console.log('Using default schedule configuration');
      
      // You could implement database loading here:
      // const savedSchedule = await this.loadFromDB();
      // if (savedSchedule) {
      //   this.currentSchedule = savedSchedule;
      // }
      
    } catch (error) {
      console.error('Failed to load schedule from database:', error);
      // Fall back to default schedule
    }
  }

  async startScheduledJobs() {
    console.log('Starting scheduled sync jobs...');
    
    // Stop existing jobs first
    this.stopAllJobs();
    
    for (const schedule of this.currentSchedule.schedules) {
      if (schedule.enabled) {
        await this.scheduleJob(schedule);
      }
    }
    
    console.log(`Started ${this.scheduledJobs.size} scheduled jobs`);
  }

  async scheduleJob(schedule) {
    try {
      const [hour, minute] = schedule.time.split(':');
      const cronExpression = `${minute} ${hour} * * *`; // Daily at specified time
      
      console.log(`Scheduling job: ${schedule.description} with cron: ${cronExpression}`);
      
      const job = cron.schedule(cronExpression, async () => {
        await this.executeScheduledSync(schedule);
      }, {
        scheduled: true,
        timezone: schedule.timezone || 'Asia/Jakarta'
      });
      
      this.scheduledJobs.set(schedule.time, {
        job,
        schedule,
        lastRun: null,
        nextRun: this.getNextRunTime(cronExpression, schedule.timezone)
      });
      
      console.log(`Scheduled job created for ${schedule.time}`);
      
    } catch (error) {
      console.error(`Failed to schedule job for ${schedule.time}:`, error);
    }
  }

  async executeScheduledSync(schedule) {
    const syncId = uuidv4();
    const executedAt = new Date().toISOString();
    
    console.log(`Executing scheduled sync: ${syncId} - ${schedule.description}`);
    
    try {
      // Calculate date range for sync (previous day)
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Prepare sync parameters
      const syncParams = {
        syncId,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        dryRun: false,
        executedAt,
        createdBy: 'scheduler',
        ...this.currentSchedule.defaultParams
      };
      
      console.log(`Sync parameters:`, {
        syncId,
        dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        schedule: schedule.description
      });
      
      // Execute sync
      const result = await this.syncService.syncAttendance(syncParams);
      
      // Update last run time
      const jobInfo = this.scheduledJobs.get(schedule.time);
      if (jobInfo) {
        jobInfo.lastRun = executedAt;
        jobInfo.nextRun = this.getNextRunTime(
          `${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} * * *`,
          schedule.timezone
        );
      }
      
      // Send WhatsApp notification if enabled
      if (this.currentSchedule.defaultParams.sendWhatsApp && 
          this.currentSchedule.notifications?.whatsapp?.enabled) {
        try {
          await this.whatsappService.sendSyncReport(result);
          console.log(`WhatsApp notification sent for sync: ${syncId}`);
        } catch (whatsappError) {
          console.error(`Failed to send WhatsApp notification for sync ${syncId}:`, whatsappError);
        }
      }
      
      console.log(`Scheduled sync completed successfully: ${syncId}`);
      
    } catch (error) {
      console.error(`Scheduled sync failed: ${syncId}`, error);
      
      // Send error notification
      try {
        await this.whatsappService.sendErrorNotification(error, {
          operation: 'scheduled_sync',
          schedule: schedule.description,
          syncId
        });
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }
    }
  }

  getNextRunTime(cronExpression, timezone = 'Asia/Jakarta') {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd use a proper cron parser
      const [minute, hour] = cronExpression.split(' ');
      
      const now = new Date();
      const nextRun = new Date();
      nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      return nextRun.toISOString();
      
    } catch (error) {
      console.error('Failed to calculate next run time:', error);
      return null;
    }
  }

  stopAllJobs() {
    console.log('Stopping all scheduled jobs...');
    
    for (const [time, jobInfo] of this.scheduledJobs) {
      try {
        jobInfo.job.stop();
        jobInfo.job.destroy();
        console.log(`Stopped job for ${time}`);
      } catch (error) {
        console.error(`Failed to stop job for ${time}:`, error);
      }
    }
    
    this.scheduledJobs.clear();
    console.log('All scheduled jobs stopped');
  }

  async getSchedule() {
    // Add runtime information to schedule
    const scheduleWithRuntime = {
      ...this.currentSchedule,
      schedules: this.currentSchedule.schedules.map(schedule => {
        const jobInfo = this.scheduledJobs.get(schedule.time);
        return {
          ...schedule,
          lastRun: jobInfo?.lastRun || null,
          nextRun: jobInfo?.nextRun || null,
          isActive: jobInfo ? true : false
        };
      })
    };
    
    return scheduleWithRuntime;
  }

  async updateSchedule(newSchedule) {
    console.log('Updating sync schedule...');
    
    try {
      // Validate schedule format
      this.validateSchedule(newSchedule);
      
      // Stop existing jobs
      this.stopAllJobs();
      
      // Update current schedule
      this.currentSchedule = {
        ...this.currentSchedule,
        ...newSchedule
      };
      
      // Save to database (placeholder)
      await this.saveScheduleToDatabase(this.currentSchedule);
      
      // Start new jobs if enabled
      if (this.currentSchedule.enabled) {
        await this.startScheduledJobs();
      }
      
      console.log('Schedule updated successfully');
      return this.currentSchedule;
      
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  }

  validateSchedule(schedule) {
    if (!schedule || typeof schedule !== 'object') {
      throw new Error('Invalid schedule format');
    }
    
    if (typeof schedule.enabled !== 'boolean') {
      throw new Error('Schedule enabled property must be boolean');
    }
    
    if (!Array.isArray(schedule.schedules)) {
      throw new Error('Schedule schedules property must be an array');
    }
    
    for (const item of schedule.schedules) {
      if (!item.time || !item.time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        throw new Error(`Invalid time format: ${item.time}`);
      }
      
      if (typeof item.enabled !== 'boolean') {
        throw new Error('Schedule item enabled property must be boolean');
      }
    }
  }

  async saveScheduleToDatabase(schedule) {
    try {
      // Placeholder for database save operation
      // In a real implementation, you would save to a database table
      console.log('Schedule saved to database (placeholder)');
      
      // Example implementation:
      // const connection = await this.dbManager.getConnection('EmployeeWorkflow');
      // const query = `
      //   UPDATE tblSyncSchedule 
      //   SET ScheduleConfig = @config, UpdatedAt = GETDATE()
      //   WHERE ID = 1
      // `;
      // const request = connection.request();
      // request.input('config', sql.Text, JSON.stringify(schedule));
      // await request.query(query);
      
    } catch (error) {
      console.error('Failed to save schedule to database:', error);
      // Don't throw error here to avoid breaking the update process
    }
  }

  async toggleSchedule(enabled) {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} sync schedule...`);
    
    this.currentSchedule.enabled = enabled;
    
    if (enabled) {
      await this.startScheduledJobs();
    } else {
      this.stopAllJobs();
    }
    
    await this.saveScheduleToDatabase(this.currentSchedule);
    
    console.log(`Schedule ${enabled ? 'enabled' : 'disabled'} successfully`);
  }

  async getJobStatus() {
    const jobs = [];
    
    for (const [time, jobInfo] of this.scheduledJobs) {
      jobs.push({
        time,
        description: jobInfo.schedule.description,
        enabled: jobInfo.schedule.enabled,
        lastRun: jobInfo.lastRun,
        nextRun: jobInfo.nextRun,
        isRunning: jobInfo.job.running || false
      });
    }
    
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.enabled).length,
      jobs
    };
  }

  async executeManualSync(params) {
    // This method allows manual execution of sync with custom parameters
    const syncId = uuidv4();
    const executedAt = new Date().toISOString();
    
    const syncParams = {
      syncId,
      executedAt,
      createdBy: 'manual',
      ...this.currentSchedule.defaultParams,
      ...params
    };
    
    console.log(`Executing manual sync: ${syncId}`);
    
    try {
      const result = await this.syncService.syncAttendance(syncParams);
      
      // Send WhatsApp notification if requested
      if (params.sendWhatsApp) {
        try {
          await this.whatsappService.sendSyncReport(result, params.whatsappChatId);
        } catch (whatsappError) {
          console.error(`Failed to send WhatsApp notification for manual sync ${syncId}:`, whatsappError);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error(`Manual sync failed: ${syncId}`, error);
      throw error;
    }
  }

  // Cleanup method to be called when shutting down
  async shutdown() {
    console.log('Shutting down Scheduler Service...');
    this.stopAllJobs();
    this.isInitialized = false;
    console.log('Scheduler Service shut down successfully');
  }
}

module.exports = { SchedulerService };