import axios from 'axios';
import { SyncAttendanceParams, SyncResult, SyncSchedule, SyncHistoryParams } from '../types/sync';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sync Attendance API calls
export const syncAttendance = async (params: SyncAttendanceParams): Promise<SyncResult> => {
  const response = await api.post('/sync/attendance', params);
  return response.data;
};

export const getSyncHistory = async (params?: SyncHistoryParams) => {
  const response = await api.get('/sync/history', { params });
  return response.data;
};

export const getSyncStatistics = async (params?: { 
  startDate?: string; 
  endDate?: string; 
  status?: string; 
}) => {
  const response = await api.get('/sync/statistics', { params });
  return response.data;
};

// Schedule Management
export const getSyncSchedule = async () => {
  const response = await api.get('/sync/schedule');
  return response.data;
};

export const updateSyncSchedule = async (schedule: SyncSchedule) => {
  const response = await api.put('/sync/schedule', schedule);
  return response.data;
};

export const enableSchedule = async (enabled: boolean) => {
  const response = await api.patch('/sync/schedule/toggle', { enabled });
  return response.data;
};

// Manual sync operations
export const startManualSync = async (params: SyncAttendanceParams) => {
  const response = await api.post('/sync/manual', params);
  return response.data;
};

export const stopSync = async (syncId: string) => {
  const response = await api.post(`/sync/${syncId}/stop`);
  return response.data;
};

export const getSyncStatus = async (syncId: string) => {
  const response = await api.get(`/sync/${syncId}/status`);
  return response.data;
};

// WhatsApp Integration
export const testWhatsAppConnection = async () => {
  const response = await api.post('/sync/whatsapp/test');
  return response.data;
};

export const sendSyncReport = async (syncId: string, chatId?: string) => {
  const response = await api.post('/sync/whatsapp/send-report', { syncId, chatId });
  return response.data;
};

export const getWhatsAppConfig = async () => {
  const response = await api.get('/sync/whatsapp/config');
  return response.data;
};

export const updateWhatsAppConfig = async (config: {
  enabled: boolean;
  defaultChatId?: string;
  apiUrl?: string;
  token?: string;
}) => {
  const response = await api.put('/sync/whatsapp/config', config);
  return response.data;
};

// Export functionality
export const exportSyncReport = async (params: {
  syncId?: string;
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'json' | 'excel';
}) => {
  const response = await api.get('/sync/export', { 
    params,
    responseType: 'blob'
  });
  return response;
};

// Data validation and preview
export const previewSyncData = async (params: {
  startDateTime: string;
  endDateTime: string;
  limit?: number;
}) => {
  const response = await api.post('/sync/preview', params);
  return response.data;
};

export const validateSyncData = async (params: {
  startDateTime: string;
  endDateTime: string;
}) => {
  const response = await api.post('/sync/validate', params);
  return response.data;
};

// System health and monitoring
export const getSyncSystemHealth = async () => {
  const response = await api.get('/sync/health');
  return response.data;
};

export const getDatabaseConnections = async () => {
  const response = await api.get('/sync/database/status');
  return response.data;
};

export default {
  syncAttendance,
  getSyncHistory,
  getSyncStatistics,
  getSyncSchedule,
  updateSyncSchedule,
  enableSchedule,
  startManualSync,
  stopSync,
  getSyncStatus,
  testWhatsAppConnection,
  sendSyncReport,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  exportSyncReport,
  previewSyncData,
  validateSyncData,
  getSyncSystemHealth,
  getDatabaseConnections,
};