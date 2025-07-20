import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Assessment as CalendarIcon,
  Home as HomeIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiBreadcrumbs-separator': {
    color: theme.palette.text.secondary,
  },
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
}));

interface PageHeaderProps {
  title: string;
  subtitle: string;
  currentPage: 'dashboard' | 'schedule' | 'enhanced-attendance';
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, currentPage, action }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const navigationItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: DashboardIcon,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      path: '/schedule',
      icon: ClockIcon,
    },
    {
      key: 'enhanced-attendance',
      label: 'View Attendance',
      path: '/enhanced-attendance',
      icon: CalendarIcon,
    },
  ];

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: 'Home',
        path: '/',
        icon: HomeIcon,
      },
    ];

    switch (currentPage) {
      case 'dashboard':
        breadcrumbs.push({
          label: 'Dashboard',
          path: '/dashboard',
          icon: DashboardIcon,
        });
        break;
      case 'schedule':
        breadcrumbs.push({
          label: 'Dashboard',
          path: '/dashboard',
          icon: DashboardIcon,
        });
        breadcrumbs.push({
          label: 'Schedule',
          path: '/schedule',
          icon: ScheduleIcon,
        });
        break;
      case 'enhanced-attendance':
        breadcrumbs.push({
          label: 'Dashboard',
          path: '/dashboard',
          icon: DashboardIcon,
        });
        breadcrumbs.push({
          label: 'Schedule',
          path: '/schedule',
          icon: ScheduleIcon,
        });
        breadcrumbs.push({
          label: 'Enhanced Attendance Report',
          path: '/enhanced-attendance',
          icon: CalendarIcon,
        });
        break;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Breadcrumbs */}
      <StyledBreadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map((breadcrumb, index) => {
          const Icon = breadcrumb.icon;
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast) {
            return (
              <Typography 
                key={breadcrumb.path}
                color="text.primary" 
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Icon sx={{ mr: 0.5 }} fontSize="inherit" />
                {breadcrumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={breadcrumb.path}
              component={RouterLink}
              to={breadcrumb.path}
              color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Icon sx={{ mr: 0.5 }} fontSize="inherit" />
              {breadcrumb.label}
            </Link>
          );
        })}
      </StyledBreadcrumbs>

      {/* Header */}
      <HeaderCard elevation={0}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems={isMobile ? "flex-start" : "center"}
          flexDirection={isMobile ? "column" : "row"}
          gap={2}
        >
          <Box>
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {subtitle}
            </Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {action && (
              <Box sx={{ mr: 1 }}>
                {action}
              </Box>
            )}
            {navigationItems
              .filter(item => item.key !== currentPage)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.key}
                    component={RouterLink}
                    to={item.path}
                    variant="contained"
                    color="secondary"
                    startIcon={<Icon />}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
          </Box>
        </Box>
      </HeaderCard>
    </>
  );
};

export default PageHeader;