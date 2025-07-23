import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const reportApi = axios.create({
  baseURL: `${API_BASE_URL}/reports`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
reportApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
reportApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Report Generation API
export const generateReport = async (params: {
  startDateTime: string;
  endDateTime: string;
  controllerList?: string[];
  insertToAttendanceReport?: boolean;
  insertToMcgClocking?: boolean;
  useFilo?: boolean;
  manualTimes?: any;
  toleranceSeconds?: number;
  whatsappChatId?: string;
  sendWhatsApp?: boolean;
}) => {
  const response = await reportApi.post('/generate', params);
  return response.data;
};

// Process Unprocessed Records API
export const processUnprocessedRecords = async (params: {
  batchSize?: number;
  insertToMcgClocking?: boolean;
}) => {
  const response = await reportApi.post('/process-unprocessed', params);
  return response.data;
};

// Get Report Statistics API
export const getReportStatistics = async (params: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'date' | 'controller' | 'status';
}) => {
  const response = await reportApi.get('/statistics', { params });
  return response.data;
};

// Get Report History API
export const getReportHistory = async (params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  const response = await reportApi.get('/history', { params });
  return response.data;
};

// Get Available Controllers API
export const getControllers = async () => {
  const response = await reportApi.get('/controllers');
  return response.data;
};

// Export Report API
export const exportReport = async (params: {
  startDateTime: string;
  endDateTime: string;
  controllerList?: string[];
  format?: 'csv' | 'json';
}) => {
  const response = await reportApi.get('/export', { 
    params,
    responseType: params.format === 'csv' ? 'blob' : 'json'
  });
  return response;
};

// WhatsApp Integration APIs
export const sendWhatsAppReport = async (params: {
  chatId: string;
  startDateTime: string;
  endDateTime: string;
  format?: 'csv' | 'json';
  includeFile?: boolean;
  controllerList?: string[];
}) => {
  const response = await reportApi.post('/whatsapp/send', params);
  return response.data;
};

export const testWhatsAppConnection = async () => {
  const response = await reportApi.get('/whatsapp/test');
  return response.data;
};

export const getWhatsAppConfig = async () => {
  const response = await reportApi.get('/whatsapp/config');
  return response.data;
};

export const updateWhatsAppConfig = async (config: {
  API_URL?: string;
  TIMEOUT_SECONDS?: number;
  MAX_FILE_SIZE_MB?: number;
  ENABLED?: boolean;
  DEFAULT_CHAT_ID?: string;
}) => {
  const response = await reportApi.put('/whatsapp/config', config);
  return response.data;
};

export default reportApi;