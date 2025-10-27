import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { syncAttendance, getSyncHistory, previewSyncData } from '@/api/syncApi';
import { SyncAttendanceParams, SyncResult, SyncHistoryItem } from '@/types/sync';

const SyncAttendance: React.FC = () => {
  const [params, setParams] = useState<SyncAttendanceParams>({
    startDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    endDateTime: new Date().toISOString(), // Now
    sendWhatsApp: false,
    whatsappChatId: '',
    dryRun: true,
    batchSize: 100,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const response = await getSyncHistory({ limit: 10 });
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const result = await syncAttendance(params);
      setResult(result);
      await loadSyncHistory(); // Refresh history
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sync');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await previewSyncData({
        startDateTime: params.startDateTime,
        endDateTime: params.endDateTime,
        limit: 100
      });
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to preview data');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sync Attendance
        </Typography>
        
        <Grid container spacing={3}>
          {/* Configuration Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sync Parameters
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={new Date(params.startDateTime)}
                      onChange={(date) => date && setParams(prev => ({
                        ...prev,
                        startDateTime: date.toISOString()
                      }))}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={new Date(params.endDateTime)}
                      onChange={(date) => date && setParams(prev => ({
                        ...prev,
                        endDateTime: date.toISOString()
                      }))}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Batch Size"
                      type="number"
                      fullWidth
                      value={params.batchSize}
                      onChange={(e) => setParams(prev => ({
                        ...prev,
                        batchSize: parseInt(e.target.value) || 100
                      }))}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="WhatsApp Chat ID (optional)"
                      fullWidth
                      value={params.whatsappChatId}
                      onChange={(e) => setParams(prev => ({
                        ...prev,
                        whatsappChatId: e.target.value
                      }))}
                      helperText="Leave empty to use default chat"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={params.sendWhatsApp}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            sendWhatsApp: e.target.checked
                          }))}
                        />
                      }
                      label="Send WhatsApp Notification"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={params.dryRun}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            dryRun: e.target.checked
                          }))}
                        />
                      }
                      label="Dry Run (Preview Only)"
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    disabled={loading}
                  >
                    Preview Data
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleSync}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Syncing...' : 'Start Sync'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setShowHistory(true)}
                  >
                    View History
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Status Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sync Status
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {result && (
                  <Box>
                    <Chip
                      label={result.success ? 'Success' : 'Failed'}
                      color={result.success ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Records Processed:</strong> {result.data?.recordsProcessed || 0}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Records Synced:</strong> {result.data?.recordsInserted || 0}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Errors:</strong> {result.data?.errors?.length || 0}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Duration:</strong> {result.data?.executionTimeMs ? `${result.data.executionTimeMs}ms` : 'N/A'}
                    </Typography>
                    
                    {result.message && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Message:</strong> {result.message}
                      </Typography>
                    )}
                    
                    {result.data?.errors && result.data.errors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="error">
                          <strong>Errors:</strong>
                        </Typography>
                        {result.data.errors.slice(0, 3).map((error, index) => (
                          <Typography key={index} variant="caption" display="block" color="error">
                            • {error}
                          </Typography>
                        ))}
                        {result.data.errors.length > 3 && (
                          <Typography variant="caption" color="error">
                            ... and {result.data.errors.length - 3} more errors
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
                
                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      Syncing attendance data...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Preview Dialog */}
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Data Preview</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.employeeId}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.checkIn || 'N/A'}</TableCell>
                      <TableCell>{row.checkOut || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.status === 'Present' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* History Dialog */}
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Sync History</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Records</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={item.status === 'success' ? 'success' : 
                                item.status === 'error' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{item.recordsProcessed || 0}</TableCell>
                      <TableCell>{item.executionTimeMs ? `${item.executionTimeMs}ms` : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.parameters?.dryRun ? 'Dry Run' : 'Live'}
                          size="small"
                          variant={item.parameters?.dryRun ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHistory(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SyncAttendance;