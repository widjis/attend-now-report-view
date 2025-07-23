import React, { useState } from 'react';
import { Box, Tabs, Tab, Container, Paper } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { ReportGeneration, ReportHistory, ReportStatistics, WhatsAppSettings } from '../components/reports';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reports-tab-${index}`,
    'aria-controls': `reports-tabpanel-${index}`,
  };
}

const Reports: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
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
        <TabPanel value={value} index={0}>
          <ReportGeneration />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <ReportHistory />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <ReportStatistics />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <WhatsAppSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Reports;