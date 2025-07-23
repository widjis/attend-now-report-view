import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../components/settings/UserManagement';
import RoleManagement from '../components/settings/RoleManagement';
import AccountSettings from '../components/settings/AccountSettings';
import { 
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { ReportGeneration, ReportHistory, ReportStatistics, WhatsAppSettings } from '../components/reports';
import { useLocation } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportTabValue, setReportTabValue] = useState(0);
  const { user, hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  // Check if we're coming from the reports page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromReports = params.get('fromReports');
    if (fromReports === 'true') {
      setTabValue(3); // Set to Reports tab
    }
  }, [location]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReportTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setReportTabValue(newValue);
  };

  // Redirect if not admin
  useEffect(() => {
    if (!hasRole('admin')) {
      // You could redirect here if needed
      console.log('User is not authorized to view settings');
    }
  }, [hasRole]);

  return (
    <Box>
      <PageHeader 
        title="Settings" 
        subtitle="Manage system settings, user accounts, and reports" 
        currentPage="dashboard" 
      />

      <Container maxWidth="xl">
        <Paper elevation={0} sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="settings tabs"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : undefined}
              allowScrollButtonsMobile
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  minWidth: isMobile ? 'auto' : 120,
                  py: 2,
                }
              }}
            >
              <Tab label="User Management" {...a11yProps(0)} />
              <Tab label="Role Management" {...a11yProps(1)} />
              <Tab label="Account Settings" {...a11yProps(2)} />
              <Tab label="Reports" {...a11yProps(3)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <UserManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <RoleManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <AccountSettings />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <Box>
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={reportTabValue}
                    onChange={handleReportTabChange}
                    aria-label="reports tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab icon={<AssessmentIcon />} label="Generate Report" {...a11yProps(0)} />
                    <Tab icon={<HistoryIcon />} label="Report History" {...a11yProps(1)} />
                    <Tab icon={<BarChartIcon />} label="Statistics" {...a11yProps(2)} />
                    <Tab icon={<WhatsAppIcon />} label="WhatsApp Settings" {...a11yProps(3)} />
                  </Tabs>
                </Box>
                <TabPanel value={reportTabValue} index={0}>
                  <ReportGeneration />
                </TabPanel>
                <TabPanel value={reportTabValue} index={1}>
                  <ReportHistory />
                </TabPanel>
                <TabPanel value={reportTabValue} index={2}>
                  <ReportStatistics />
                </TabPanel>
                <TabPanel value={reportTabValue} index={3}>
                  <WhatsAppSettings />
                </TabPanel>
              </Paper>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;