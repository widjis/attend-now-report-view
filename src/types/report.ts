// Report Generation Types
export interface ReportGenerationParams {
  startDateTime: string;
  endDateTime: string;
  controllerList?: string[];
  insertToAttendanceReport?: boolean;
  insertToMcgClocking?: boolean;
  useFilo?: boolean;
  manualTimes?: ManualTimes | null;
  toleranceSeconds?: number;
  whatsappChatId?: string;
  sendWhatsApp?: boolean;
}

export interface ManualTimes {
  timeIn: string;
  timeOut: string;
}

export interface ReportGenerationResult {
  success: boolean;
  message: string;
  data: {
    report: {
      recordsProcessed: number;
      recordsInserted: number;
      recordsSkipped: number;
      executionTime: number;
      data?: any[];
    };
    whatsapp?: WhatsAppResult;
  };
}

// WhatsApp Configuration Types
export interface WhatsAppConfig {
  API_URL: string;
  TIMEOUT_SECONDS: number;
  MAX_FILE_SIZE_MB: number;
  ENABLED: boolean;
  DEFAULT_CHAT_ID: string;
}

export interface WhatsAppConfigUpdate {
  API_URL?: string;
  TIMEOUT_SECONDS?: number;
  MAX_FILE_SIZE_MB?: number;
  ENABLED?: boolean;
  DEFAULT_CHAT_ID?: string;
}

export interface WhatsAppResult {
  success: boolean;
  message: string;
  chatId?: string;
  messageId?: string;
  error?: string;
}

// Report History Types
export interface ReportHistoryItem {
  Id: number;
  ReportType: string;
  Parameters: string;
  Status: 'Success' | 'Failed' | 'Partial';
  ErrorMessage?: string;
  WhatsAppSent: boolean;
  WhatsAppChatId?: string;
  CreatedBy: string;
  CreatedAt: string;
}

export interface ReportHistoryResponse {
  success: boolean;
  data: {
    records: ReportHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Report Statistics Types
export interface ReportStatistics {
  success: boolean;
  data: {
    groupedData: StatisticsGroupItem[];
    overall: OverallStatistics;
    groupBy: 'date' | 'controller' | 'status';
  };
}

export interface StatisticsGroupItem {
  groupKey: string;
  recordCount: number;
}

export interface OverallStatistics {
  totalRecords: number;
  processedRecords: number;
  unprocessedRecords: number;
  uniqueStaff: number;
  uniqueControllers: number;
}

// Export Types
export interface ExportParams {
  startDateTime: string;
  endDateTime: string;
  controllerList?: string[];
  format?: 'csv' | 'json';
}

// Process Unprocessed Records Types
export interface ProcessUnprocessedParams {
  batchSize?: number;
  insertToMcgClocking?: boolean;
}

export interface ProcessUnprocessedResult {
  success: boolean;
  message: string;
  data: {
    totalRecords: number;
    processedCount: number;
    errorCount: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Controllers List Type
export interface ControllersResponse {
  success: boolean;
  data: string[];
}