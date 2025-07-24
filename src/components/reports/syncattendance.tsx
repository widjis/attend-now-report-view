import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  DateTimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ExpandMore as ExpandMoreIcon,
  Sync as SyncIcon,
  Schedule as ScheduleIcon,
  WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { 
  syncAttendance, 
  getSyncHistory, 
  getSyncSchedule, 
  updateSyncSchedule,
  testWhatsAppConnection 
} from '../../api/syncApi';
import { SyncAttendanceParams, SyncResult, SyncSchedule } from '../../types/sync';

const SyncAttendance: React.FC = () => {
  // State management
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(new Date());
  const [autoSync, setAutoSync] = useState(true);
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule>({
    enabled: true,
    schedules: [
      { time: '01:00', enabled: true, description: 'Daily sync at 1:00 AM' },
      { time: '13:00', enabled: true, description: 'Daily sync at 1:00 PM' }
    ]
  });
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappChatId, setWhatsappChatId] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);

  // Load sync history and schedule on component mount
  useEffect(() => {
    loadSyncHistory();
    loadSyncSchedule();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const response = await getSyncHistory({ limit: 10 });
      setSyncHistory(response.data);
    } catch (err) {
      console.error('Failed to load sync history:', err);
    }
  };

  const loadSyncSchedule = async () => {
    try {
      const response = await getSyncSchedule();
      setSyncSchedule(response.data);
    } catch (err) {
      console.error('Failed to load sync schedule:', err);
    }
  };

  // Handle manual sync
  const handleSyncAttendance = async () => {
    if (!startDateTime || !endDateTime) {
      setError('Please select both start and end date/time');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: SyncAttendanceParams = {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        sendWhatsApp: whatsappEnabled,
        whatsappChatId: whatsappEnabled ? whatsappChatId : undefined,
      };

      const response = await syncAttendance(params);
      setResult(response);
      loadSyncHistory(); // Refresh history
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync attendance');
    } finally {
      setLoading(false);
    }
  };

  // Handle schedule update
  const handleUpdateSchedule = async () => {
    try {
      await updateSyncSchedule(syncSchedule);
      setScheduleDialogOpen(false);
      loadSyncSchedule();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  // Test WhatsApp connection
  const handleTestWhatsApp = async () => {
    try {
      const response = await testWhatsAppConnection();
      if (response.success) {
        setError(null);
        // Show success message
      }
    } catch (err: any) {
      setError('WhatsApp connection test failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatSyncStatus = (status: string) => {
    switch (status) {
      case 'success':
        return { icon: <CheckCircleIcon color="success" />, color: 'success.main' };
      case 'error':
        return { icon: <ErrorIcon color="error" />, color: 'error.main' };
      case 'running':
        return { icon: <CircularProgress size={20} />, color: 'info.main' };
      default:
        return { icon: <InfoIcon color="info" />, color: 'info.main' };
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SyncIcon />
          Sync Attendance
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Synchronize attendance data between tblTransaction (DataDBEnt) to tblAttendance & MCG tables
        </Typography>

        <Grid container spacing={3}>
          {/* Main Sync Panel */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrowIcon />
                  Manual Sync
                </Typography>

                <Grid container spacing={2}>
                  {/* Date/Time Selection */}
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={startDateTime}
                      onChange={setStartDateTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={endDateTime}
                      onChange={setEndDateTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>

                  {/* WhatsApp Options */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={whatsappEnabled}
                          onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        />
                      }
                      label="Send WhatsApp Notification"
                    />
                  </Grid>
                  
                  {whatsappEnabled && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="WhatsApp Chat ID"
                        value={whatsappChatId}
                        onChange={(e) => setWhatsappChatId(e.target.value)}
                        placeholder="Enter WhatsApp chat ID"
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={handleTestWhatsApp} size="small">
                              <WhatsAppIcon />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SyncIcon />}
                    onClick={handleSyncAttendance}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Syncing...' : 'Sync Attendance'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Automated Schedule */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Accordion 
                  expanded={expandedSchedule} 
                  onChange={() => setExpandedSchedule(!expandedSchedule)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon />
                      Automated Schedule
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={syncSchedule.enabled}
                              onChange={(e) => setSyncSchedule({
                                ...syncSchedule,
                                enabled: e.target.checked
                              })}
                            />
                          }
                          label="Enable Automated Sync"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Schedule:
                        </Typography>
                        <List dense>
                          {syncSchedule.schedules.map((schedule, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <AccessTimeIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={schedule.time}
                                secondary={schedule.description}
                              />
                              <Switch
                                checked={schedule.enabled}
                                onChange={(e) => {
                                  const newSchedules = [...syncSchedule.schedules];
                                  newSchedules[index].enabled = e.target.checked;
                                  setSyncSchedule({
                                    ...syncSchedule,
                                    schedules: newSchedules
                                  });
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          onClick={() => setScheduleDialogOpen(true)}
                        >
                          Configure Schedule
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>

            {/* Sync History */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Accordion 
                  expanded={expandedHistory} 
                  onChange={() => setExpandedHistory(!expandedHistory)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon />
                      Sync History
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {syncHistory.map((sync, index) => {
                        const statusInfo = formatSyncStatus(sync.status);
                        return (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              {statusInfo.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={`${sync.startDate} - ${sync.endDate}`}
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    Status: {sync.status} | 
                                    Processed: {sync.recordsProcessed} | 
                                    Valid: {sync.validRecords} | 
                                    Invalid: {sync.invalidRecords}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(sync.executedAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Panel */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon />
                  Sync Results
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {result && (
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📅 Attendance Sync Complete! 📅
                    </Typography>
                    <Typography variant="body2">
                      Date: {new Date(result.data.executedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Typography variant="body2">
                      Status: ✅ Success
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">
                      - Total transactions retrieved: {result.data.totalRetrieved}
                    </Typography>
                    <Typography variant="body2">
                      - Total transactions processed: {result.data.recordsProcessed}
                    </Typography>
                    <Typography variant="body2">
                      - Valid transactions: {result.data.validRecords}
                    </Typography>
                    <Typography variant="body2">
                      - Invalid transactions: {result.data.invalidRecords}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">
                      📊 Sync completed successfully! 📊
                    </Typography>
                    <Typography variant="body2">
                      🕒 Execution Time: {new Date(result.data.executedAt).toLocaleString()}
                    </Typography>
                    {result.data.whatsapp && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                          WhatsApp: {result.data.whatsapp.success ? '✅ Sent' : '❌ Failed'}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {!result && !error && !loading && (
                  <Typography variant="body2" color="text.secondary">
                    Configure parameters and click "Sync Attendance" to see results here.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Schedule Configuration Dialog */}
        <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configure Sync Schedule</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure when automatic attendance sync should run. Default times are 1:00 AM and 1:00 PM.
            </Typography>
            {/* Schedule configuration form would go here */}
            <Alert severity="info" sx={{ mt: 2 }}>
              Schedule configuration will be implemented in the next phase.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSchedule} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SyncAttendance;