// Sync Attendance Types

export interface SyncAttendanceParams {
  startDateTime: string;
  endDateTime: string;
  sendWhatsApp?: boolean;
  whatsappChatId?: string;
  dryRun?: boolean;
  batchSize?: number;
  tolerance?: number;
  insertToMCG?: boolean;
  useManualTimes?: boolean;
  manualInTime?: string;
  manualOutTime?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data: {
    syncId: string;
    startDateTime: string;
    endDateTime: string;
    status: 'success' | 'error' | 'running' | 'cancelled';
    totalRetrieved: number;
    recordsProcessed: number;
    recordsInserted: number;
    recordsSkipped: number;
    validRecords: number;
    invalidRecords: number;
    executionTimeMs: number;
    executedAt: string;
    createdBy: string;
    parameters?: any;
    errors?: string[];
    warnings?: string[];
    whatsapp?: {
      success: boolean;
      message?: string;
      chatId?: string;
    };
  };
}

export interface SyncHistoryParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  status?: 'success' | 'error' | 'running' | 'cancelled';
  createdBy?: string;
}

export interface SyncHistoryItem {
  id: string;
  syncId: string;
  startDate: string;
  endDate: string;
  status: 'success' | 'error' | 'running' | 'cancelled';
  totalRetrieved: number;
  recordsProcessed: number;
  recordsInserted: number;
  recordsSkipped: number;
  validRecords: number;
  invalidRecords: number;
  executionTimeMs: number;
  executedAt: string;
  createdBy: string;
  parameters?: any;
  errorMessage?: string;
  whatsappSent?: boolean;
}

export interface SyncScheduleItem {
  time: string; // HH:MM format
  enabled: boolean;
  description: string;
  timezone?: string;
  lastRun?: string;
  nextRun?: string;
}

export interface SyncSchedule {
  enabled: boolean;
  schedules: SyncScheduleItem[];
  defaultParams?: Partial<SyncAttendanceParams>;
  notifications?: {
    whatsapp?: {
      enabled: boolean;
      chatId?: string;
    };
    email?: {
      enabled: boolean;
      recipients?: string[];
    };
  };
}

export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalRecordsProcessed: number;
  totalRecordsInserted: number;
  totalRecordsSkipped: number;
  averageExecutionTime: number;
  lastSyncDate?: string;
  nextScheduledSync?: string;
  uptime: {
    percentage: number;
    totalDays: number;
  };
}

export interface WhatsAppConfig {
  enabled: boolean;
  apiUrl?: string;
  token?: string;
  defaultChatId?: string;
  messageTemplate?: string;
  retryAttempts?: number;
  timeout?: number;
}

export interface SyncPreviewData {
  totalRecords: number;
  sampleRecords: any[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  controllers: string[];
  estimatedProcessingTime: number;
  potentialIssues: string[];
}

export interface SyncValidationResult {
  isValid: boolean;
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    count?: number;
    affectedRecords?: any[];
  }[];
  recommendations: string[];
  estimatedSuccess: {
    percentage: number;
    expectedValid: number;
    expectedInvalid: number;
  };
}

export interface DatabaseStatus {
  name: string;
  connected: boolean;
  lastChecked: string;
  responseTime?: number;
  error?: string;
  tables?: {
    name: string;
    accessible: boolean;
    recordCount?: number;
  }[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  databases: DatabaseStatus[];
  scheduler: {
    running: boolean;
    nextJobs: {
      time: string;
      description: string;
    }[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  lastSync?: {
    date: string;
    status: string;
    duration: number;
  };
}

export interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'manual' | 'scheduled';
  params: SyncAttendanceParams;
  startedAt?: string;
  completedAt?: string;
  progress?: {
    percentage: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
  };
  result?: SyncResult;
}

// Export types for backward compatibility with existing report types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  inTime?: string;
  outTime?: string;
  workingHours?: number;
  status: 'present' | 'absent' | 'late' | 'early_departure';
  source: 'transaction' | 'manual' | 'imported';
  createdAt: string;
  updatedAt: string;
}

export interface MCGRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  overtime?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  employeeId: string;
  controllerId: string;
  transactionTime: string;
  transactionType: 'in' | 'out';
  processed: boolean;
  processedAt?: string;
  createdAt: string;
}