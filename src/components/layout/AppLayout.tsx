import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  SwipeableDrawer,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Report as ReportIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, checkPermission } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Close drawer when navigating to a new route on mobile
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleDrawerOpen = () => {
    setMobileOpen(true);
  };
  
  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: 'dashboard:read',
    },
    {
      text: 'Schedule',
      icon: <ScheduleIcon />,
      path: '/schedule',
      permission: 'schedule:read',
    },
    {
      text: 'Enhanced Attendance',
      icon: <AssessmentIcon />,
      path: '/enhanced-attendance',
      permission: 'enhanced-attendance:read',
    },
    {
      text: 'Attendance Report',
      icon: <ReportIcon />,
      path: '/attendance-report',
      permission: 'attendance-report:read',
    },
    {
      text: 'Reports',
      icon: <ReportIcon />,
      path: '/reports',
      permission: 'reports:read',
    },
    {
      text: 'Settings',
      icon: <PersonIcon />,
      path: '/settings',
      permission: 'settings:read',
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const [resource, action] = item.permission.split(':');
    return checkPermission(resource, action);
  });

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
            }}
          >
            A
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: isMobile ? '60%' : 'auto' }}>
            <Typography variant="h6" noWrap component="div" fontWeight={600}>
              MTI Attendance System
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Report View
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* User Info Section */}
      <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.username || 'Guest User'}
            </Typography>
            <Chip
              label={user?.role || 'guest'}
              size="small"
              color={user?.role === 'admin' ? 'primary' : user?.role === 'user' ? 'secondary' : 'default'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        </Box>
      </Box>
      <Divider />

      <List sx={{ py: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: isMobile ? 1 : 0 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                // Drawer will auto-close via useEffect when route changes
              }}
              sx={{
                py: isMobile ? 1.5 : 1, // Taller touch targets on mobile
                borderRadius: isMobile ? 1 : 0, // Rounded corners on mobile
                mx: isMobile ? 1 : 0, // Horizontal margin on mobile
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '15',
                  borderRight: !isMobile ? `3px solid ${theme.palette.primary.main}` : 'none',
                  borderLeft: isMobile ? `3px solid ${theme.palette.primary.main}` : 'none',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                // Ripple effect for better touch feedback
                '& .MuiTouchRipple-root': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: isMobile ? '0.95rem' : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: isMobile ? 2 : 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: theme.palette.primary.main,
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {isMobile && (
            <Typography 
              variant="subtitle1" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                flexGrow: 1,
                fontSize: isSmallMobile ? '0.9rem' : '1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              MTI Attendance
            </Typography>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton
            size={isMobile ? "medium" : "large"}
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ 
              ml: 1,
              bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
              }
            }}
          >
            <AccountIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: isMobile ? 200 : 220,
            borderRadius: 2,
            mt: 1,
            '& .MuiMenuItem-root': {
              py: isMobile ? 1.5 : 1, // Taller touch targets on mobile
            },
          },
        }}
      >
        {user && user.role !== 'guest' && (
          <Box sx={{ px: 2, py: 1.5, bgcolor: theme.palette.grey[50] }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {user.username}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={user.role === 'admin' ? 'primary' : 'secondary'}
              sx={{ fontSize: '0.7rem', height: 20, mt: 0.5 }}
            />
          </Box>
        )}
        <MenuItem 
          onClick={handleProfileMenuClose}
          sx={{ 
            py: isMobile ? 1.5 : 1,
            '&:hover': { bgcolor: theme.palette.action.hover },
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: isMobile ? 1.5 : 1,
            '&:hover': { bgcolor: theme.palette.action.hover },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2">
            {user?.role === 'guest' ? 'Sign In' : 'Logout'}
          </Typography>
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={handleDrawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isSmallMobile ? '85%' : drawerWidth,
              overflowY: 'auto',
            },
          }}
        >
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={mobileOpen}
            onClick={handleDrawerClose}
          />
          {drawer}
        </SwipeableDrawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
          overflowX: 'hidden', // Prevent horizontal scrolling on mobile
        }}
      >
        <Toolbar />
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 3,
            px: { xs: 2, sm: 3 }, // Responsive padding
          }}
        >
          <Fade in={true} timeout={300}>
            <Box>{children}</Box>
          </Fade>
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;