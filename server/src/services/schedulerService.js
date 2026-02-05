const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { SyncAttendanceService } = require('./syncAttendanceService');
const { SyncScheduleService } = require('./syncScheduleService');
const { poolPromise } = require('../config/db');
const whatsappService = require('./whatsappService');
const { v4: uuidv4 } = require('uuid');

const SCHEDULE_FILE_PATH = path.join(__dirname, '../../schedules.json');

class SchedulerService {
  constructor() {
    this.syncService = new SyncAttendanceService();
    this.syncScheduleService = new SyncScheduleService();
    this.whatsappService = whatsappService;
    this.scheduledJobs = new Map();
    this.defaultSchedule = {
      enabled: true,
      schedules: [
        {
          id: 'attendance_sync_1',
          type: 'ATTENDANCE_SYNC',
          time: '01:00',
          enabled: true,
          description: 'Daily attendance sync at 1:00 AM',
          timezone: 'Asia/Jakarta'
        },
        {
          id: 'attendance_sync_2',
          type: 'ATTENDANCE_SYNC',
          time: '13:00',
          enabled: true,
          description: 'Daily attendance sync at 1:00 PM',
          timezone: 'Asia/Jakarta'
        },
        {
          id: 'employee_sync_1',
          type: 'EMPLOYEE_SYNC',
          time: '02:00',
          enabled: true,
          description: 'Daily employee schedule sync at 2:00 AM',
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
      await this.loadScheduleFromDatabase();
      
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
      try {
        const data = await fs.readFile(SCHEDULE_FILE_PATH, 'utf8');
        const savedSchedule = JSON.parse(data);
        if (savedSchedule) {
          this.currentSchedule = { ...this.defaultSchedule, ...savedSchedule };
          console.log('Loaded schedule from file');
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error reading schedule file:', err);
        } else {
            console.log('No saved schedule found, using default');
        }
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  async saveScheduleToDatabase(schedule) {
    try {
      await fs.writeFile(SCHEDULE_FILE_PATH, JSON.stringify(schedule, null, 2), 'utf8');
      console.log('Schedule saved to file');
    } catch (error) {
      console.error('Failed to save schedule to file:', error);
    }
  }

  async startScheduledJobs() {
    console.log('Starting scheduled sync jobs...');
    
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
      let cronExpression;
      
      if (schedule.frequency === 'interval' && schedule.intervalValue) {
        // Interval in hours (e.g. every 4 hours)
        // We use 0 as minute to run at top of hour
        cronExpression = `0 */${schedule.intervalValue} * * *`;
      } else {
        // Default to daily at specific time
        const [hour, minute] = schedule.time.split(':');
        cronExpression = `${minute} ${hour} * * *`;
      }
      
      console.log(`Scheduling job: ${schedule.description} (${schedule.type}) with cron: ${cronExpression}`);
      
      const job = cron.schedule(cronExpression, async () => {
        if (schedule.type === 'EMPLOYEE_SYNC') {
            await this.executeEmployeeSync(schedule);
        } else {
            await this.executeScheduledSync(schedule);
        }
      }, {
        scheduled: true,
        timezone: schedule.timezone || 'Asia/Jakarta'
      });
      
      this.scheduledJobs.set(schedule.id || schedule.time, {
        job,
        schedule,
        cronExpression,
        lastRun: null,
        nextRun: this.getNextRunTime(cronExpression, schedule.timezone)
      });
      
      console.log(`Scheduled job created for ${schedule.time}`);
      
    } catch (error) {
      console.error(`Failed to schedule job for ${schedule.time}:`, error);
    }
  }

  async executeEmployeeSync(schedule) {
    const syncId = uuidv4();
    const startTime = Date.now();
    const executedAt = new Date().toISOString();
    console.log(`Executing employee sync: ${syncId} - ${schedule.description}`);
    
    try {
        const result = await this.syncScheduleService.syncOrangeToMtiUsers();
        
        const logResult = {
          syncId,
          startDateTime: executedAt,
          endDateTime: executedAt,
          status: 'success',
          totalRetrieved: result.summary?.totalRows || 0,
          recordsProcessed: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
          recordsInserted: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
          recordsSkipped: result.summary?.skipped || 0,
          validRecords: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
          invalidRecords: 0,
          executionTimeMs: Date.now() - startTime,
          executedAt,
          createdBy: 'scheduler',
          parameters: { 
            type: 'EMPLOYEE_SYNC',
            scheduleId: schedule.id,
            description: schedule.description
          }
        };

        const connection = await poolPromise;
        await this.syncService.logSyncResult(connection, logResult);

        const jobInfo = this.scheduledJobs.get(schedule.id || schedule.time);
        if (jobInfo) {
            jobInfo.lastRun = executedAt;
            jobInfo.nextRun = this.getNextRunTime(
                jobInfo.cronExpression,
                schedule.timezone
            );
        }
        console.log(`Employee sync completed: ${syncId}`, result.summary);
    } catch (error) {
        console.error(`Employee sync failed: ${syncId}`, error);
        
        const logResult = {
          syncId,
          startDateTime: executedAt,
          endDateTime: executedAt,
          status: 'error',
          totalRetrieved: 0,
          recordsProcessed: 0,
          recordsInserted: 0,
          recordsSkipped: 0,
          validRecords: 0,
          invalidRecords: 0,
          executionTimeMs: Date.now() - startTime,
          executedAt,
          createdBy: 'scheduler',
          parameters: { 
            type: 'EMPLOYEE_SYNC',
            scheduleId: schedule.id,
            description: schedule.description
          },
          errors: [error.message]
        };

        const connection = await poolPromise;
        await this.syncService.logSyncResult(connection, logResult);
    }
  }

  async executeScheduledSync(schedule) {
    const syncId = uuidv4();
    const startTime = Date.now();
    const executedAt = new Date().toISOString();
    
    console.log(`Executing scheduled sync: ${syncId} - ${schedule.description}`);
    
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      
      const syncParams = {
        syncId,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        dryRun: false,
        executedAt,
        createdBy: 'scheduler',
        parameters: {
          scheduleId: schedule.id,
          type: 'ATTENDANCE_SYNC'
        },
        ...this.currentSchedule.defaultParams
      };
      
      const result = await this.syncService.syncAttendance(syncParams);
      
      const jobInfo = this.scheduledJobs.get(schedule.id || schedule.time);
      if (jobInfo) {
        jobInfo.lastRun = executedAt;
        jobInfo.nextRun = this.getNextRunTime(
          jobInfo.cronExpression,
          schedule.timezone
        );
      }
      
      if (this.currentSchedule.defaultParams.sendWhatsApp && 
          this.currentSchedule.notifications?.whatsapp?.enabled) {
        try {
          await this.whatsappService.sendSyncReport(result);
        } catch (whatsappError) {
          console.error(`Failed to send WhatsApp notification for sync ${syncId}:`, whatsappError);
        }
      }
      
      console.log(`Scheduled sync completed successfully: ${syncId}`);
      
    } catch (error) {
      console.error(`Scheduled sync failed: ${syncId}`, error);
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
      const [minute, hour] = cronExpression.split(' ');
      
      const now = new Date();
      const nextRun = new Date();
      
      if (hour.startsWith('*/')) {
        // Interval: */N
        const interval = parseInt(hour.split('/')[1]);
        const currentHour = now.getHours();
        
        // Find next multiple of interval > currentHour
        let nextHour = Math.ceil((currentHour + 1) / interval) * interval;
        
        if (nextHour >= 24) {
             nextRun.setDate(nextRun.getDate() + 1);
             nextHour = nextHour % 24;
        }
        
        nextRun.setHours(nextHour, parseInt(minute), 0, 0);
        
        // Safety check
        if (nextRun <= now) {
             nextRun.setHours(nextRun.getHours() + interval);
        }
      } else {
        // Specific time
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
        
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      
      return nextRun.toISOString();
      
    } catch (error) {
      console.error('Failed to calculate next run time:', error);
      return null;
    }
  }

  stopAllJobs() {
    console.log('Stopping all scheduled jobs...');
    
    for (const [id, jobInfo] of this.scheduledJobs) {
      try {
        jobInfo.job.stop();
        // jobInfo.job.destroy(); // destroy might not be available in all node-cron versions, check if needed
        console.log(`Stopped job for ${id}`);
      } catch (error) {
        console.error(`Failed to stop job for ${id}:`, error);
      }
    }
    
    this.scheduledJobs.clear();
    console.log('All scheduled jobs stopped');
  }

  async getSchedule() {
    const scheduleWithRuntime = {
      ...this.currentSchedule,
      schedules: this.currentSchedule.schedules.map(schedule => {
        const jobInfo = this.scheduledJobs.get(schedule.id || schedule.time);
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
      this.validateSchedule(newSchedule);
      this.stopAllJobs();
      
      this.currentSchedule = {
        ...this.currentSchedule,
        ...newSchedule
      };
      
      await this.saveScheduleToDatabase(this.currentSchedule);
      
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
    
    for (const [id, jobInfo] of this.scheduledJobs) {
      jobs.push({
        id,
        time: jobInfo.schedule.time,
        description: jobInfo.schedule.description,
        enabled: jobInfo.schedule.enabled,
        lastRun: jobInfo.lastRun,
        nextRun: jobInfo.nextRun,
        type: jobInfo.schedule.type
      });
    }
    
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.enabled).length,
      jobs
    };
  }

  async executeManualSync(params) {
    // Check if it's an employee sync request
    if (params.type === 'EMPLOYEE_SYNC') {
        const syncId = uuidv4();
        const startTime = Date.now();
        const executedAt = new Date().toISOString();
        console.log(`Executing manual employee sync: ${syncId}`);
        
        try {
            const result = await this.syncScheduleService.syncOrangeToMtiUsers();
            
            const logResult = {
              syncId,
              startDateTime: executedAt,
              endDateTime: executedAt,
              status: 'success',
              totalRetrieved: result.summary?.totalRows || 0,
              recordsProcessed: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
              recordsInserted: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
              recordsSkipped: result.summary?.skipped || 0,
              validRecords: (result.summary?.updated || 0) + (result.summary?.inserted || 0),
              invalidRecords: 0,
              executionTimeMs: Date.now() - startTime,
              executedAt,
              createdBy: params.createdBy || 'manual',
              parameters: { 
                type: 'EMPLOYEE_SYNC',
                description: 'Manual Employee Sync',
                scheduleId: params.scheduleId
              }
            };

            const connection = await poolPromise;
            await this.syncService.logSyncResult(connection, logResult);
            
            return result;
        } catch (error) {
            console.error(`Manual employee sync failed: ${syncId}`, error);
            
            const logResult = {
              syncId,
              startDateTime: executedAt,
              endDateTime: executedAt,
              status: 'error',
              totalRetrieved: 0,
              recordsProcessed: 0,
              recordsInserted: 0,
              recordsSkipped: 0,
              validRecords: 0,
              invalidRecords: 0,
              executionTimeMs: Date.now() - startTime,
              executedAt,
              createdBy: params.createdBy || 'manual',
              parameters: { 
                type: 'EMPLOYEE_SYNC',
                description: 'Manual Employee Sync',
                error: error.message,
                scheduleId: params.scheduleId
              },
              errorMessage: error.message
            };
            
            try {
                const connection = await poolPromise;
                await this.syncService.logSyncResult(connection, logResult);
            } catch (logError) {
                console.error('Failed to log failed manual employee sync:', logError);
            }
            
            throw error;
        }
    }

    // Default to attendance sync
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

  async shutdown() {
    console.log('Shutting down Scheduler Service...');
    this.stopAllJobs();
    this.isInitialized = false;
    console.log('Scheduler Service shut down successfully');
  }
}

const schedulerService = new SchedulerService();

module.exports = { SchedulerService, schedulerService };
