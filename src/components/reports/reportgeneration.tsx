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
} from '@mui/material';
import {
  DateTimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { generateReport, getControllers, exportReport } from '../../api/reportApi';
import { ReportGenerationParams, ReportGenerationResult } from '../../types/report';

const ReportGeneration: React.FC = () => {
  // State management
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(new Date());
  const [selectedControllers, setSelectedControllers] = useState<string[]>([]);
  const [availableControllers, setAvailableControllers] = useState<string[]>([]);
  const [insertToAttendanceReport, setInsertToAttendanceReport] = useState(true);
  const [insertToMcgClocking, setInsertToMcgClocking] = useState(false);
  const [useFilo, setUseFilo] = useState(true);
  const [toleranceSeconds, setToleranceSeconds] = useState(300);
  const [whatsappChatId, setWhatsappChatId] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [manualTimeIn, setManualTimeIn] = useState('');
  const [manualTimeOut, setManualTimeOut] = useState('');
  const [useManualTimes, setUseManualTimes] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  // Load available controllers on component mount
  useEffect(() => {
    const loadControllers = async () => {
      try {
        const response = await getControllers();
        setAvailableControllers(response.data);
      } catch (err) {
        console.error('Failed to load controllers:', err);
      }
    };
    loadControllers();
  }, []);

  // Handle form submission
  const handleGenerateReport = async () => {
    if (!startDateTime || !endDateTime) {
      setError('Please select both start and end date/time');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: ReportGenerationParams = {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        controllerList: selectedControllers.length > 0 ? selectedControllers : undefined,
        insertToAttendanceReport,
        insertToMcgClocking,
        useFilo,
        toleranceSeconds,
        whatsappChatId: sendWhatsApp ? whatsappChatId : undefined,
        sendWhatsApp,
        manualTimes: useManualTimes ? {
          timeIn: manualTimeIn,
          timeOut: manualTimeOut,
        } : null,
      };

      const response = await generateReport(params);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    if (!startDateTime || !endDateTime) {
      setError('Please select both start and end date/time');
      return;
    }

    try {
      const response = await exportReport({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        controllerList: selectedControllers.length > 0 ? selectedControllers : undefined,
        format,
      });

      // Handle file download
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${startDateTime.toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${startDateTime.toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export report');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Report Generation
        </Typography>

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Parameters
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

                  {/* Controller Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Controllers (Optional)</InputLabel>
                      <Select
                        multiple
                        value={selectedControllers}
                        onChange={(e) => setSelectedControllers(e.target.value as string[])}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {availableControllers.map((controller) => (
                          <MenuItem key={controller} value={controller}>
                            {controller}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Basic Options */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={insertToAttendanceReport}
                          onChange={(e) => setInsertToAttendanceReport(e.target.checked)}
                        />
                      }
                      label="Insert to Attendance Report Table"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useFilo}
                          onChange={(e) => setUseFilo(e.target.checked)}
                        />
                      }
                      label="Use FILO (First In, Last Out) Logic"
                    />
                  </Grid>
                </Grid>

                {/* Advanced Options */}
                <Accordion 
                  expanded={expandedAdvanced} 
                  onChange={() => setExpandedAdvanced(!expandedAdvanced)}
                  sx={{ mt: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Advanced Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Tolerance (Seconds)"
                          type="number"
                          value={toleranceSeconds}
                          onChange={(e) => setToleranceSeconds(Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={insertToMcgClocking}
                              onChange={(e) => setInsertToMcgClocking(e.target.checked)}
                            />
                          }
                          label="Insert to MCG Clocking Table"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={useManualTimes}
                              onChange={(e) => setUseManualTimes(e.target.checked)}
                            />
                          }
                          label="Use Manual Times"
                        />
                      </Grid>
                      {useManualTimes && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Manual Time In (HH:MM)"
                              value={manualTimeIn}
                              onChange={(e) => setManualTimeIn(e.target.value)}
                              placeholder="08:00"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Manual Time Out (HH:MM)"
                              value={manualTimeOut}
                              onChange={(e) => setManualTimeOut(e.target.value)}
                              placeholder="17:00"
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* WhatsApp Options */}
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">WhatsApp Integration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={sendWhatsApp}
                              onChange={(e) => setSendWhatsApp(e.target.checked)}
                            />
                          }
                          label="Send Report via WhatsApp"
                        />
                      </Grid>
                      {sendWhatsApp && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="WhatsApp Chat ID"
                            value={whatsappChatId}
                            onChange={(e) => setWhatsappChatId(e.target.value)}
                            placeholder="Enter WhatsApp chat ID"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    onClick={handleGenerateReport}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('json')}
                    disabled={loading}
                  >
                    Export JSON
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Panel */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {result && (
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Report Generated Successfully
                    </Typography>
                    <Typography variant="body2">
                      Records Processed: {result.data.report.recordsProcessed}
                    </Typography>
                    <Typography variant="body2">
                      Records Inserted: {result.data.report.recordsInserted}
                    </Typography>
                    <Typography variant="body2">
                      Records Skipped: {result.data.report.recordsSkipped}
                    </Typography>
                    <Typography variant="body2">
                      Execution Time: {result.data.report.executionTime}ms
                    </Typography>
                    {result.data.whatsapp && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                          WhatsApp: {result.data.whatsapp.success ? 'Sent' : 'Failed'}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {!result && !error && !loading && (
                  <Typography variant="body2" color="text.secondary">
                    Configure parameters and click "Generate Report" to see results here.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportGeneration;