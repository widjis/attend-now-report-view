import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTE_PERMISSIONS } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
  requiredPermissions?: { resource: string; action: string }[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requiredRole,
  requiredPermissions = [],
}) => {
  const { isAuthenticated, isLoading, user, checkPermission, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being initialized
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Check if route allows guest access
  const routeConfig = ROUTE_PERMISSIONS.find(route => 
    location.pathname.startsWith(route.path)
  );

  // If user is not authenticated and route requires auth
  if (!isAuthenticated && requireAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is guest and route doesn't allow guest access
  if (user?.role === 'guest' && routeConfig && !routeConfig.guestAllowed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission requirements
  for (const permission of requiredPermissions) {
    if (!checkPermission(permission.resource, permission.action)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check route-specific permissions
  if (routeConfig?.requiredPermissions) {
    for (const permission of routeConfig.requiredPermissions) {
      if (!checkPermission(permission.resource, permission.action)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;