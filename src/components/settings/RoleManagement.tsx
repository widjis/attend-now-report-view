import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types/auth';

interface Role {
  name: string;
  permissions: Permission[];
  description?: string;
}

const availableResources = [
  'dashboard',
  'schedule',
  'enhanced-attendance',
  'attendance-report',
  'users',
  'settings',
  'profile',
];

const availableActions = [
  'read',
  'create',
  'update',
  'delete',
  'export',
];

const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([
    {
      name: 'admin',
      description: 'Full access to all features',
      permissions: [
        { resource: '*', actions: ['read', 'create', 'update', 'export'] },
        { resource: 'users', actions: ['read', 'create', 'update'] },
        { resource: 'settings', actions: ['read', 'update'] },
      ],
    },
    {
      name: 'user',
      description: 'Limited access to basic features',
      permissions: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'schedule', actions: ['read'] },
        { resource: 'enhanced-attendance', actions: ['read', 'export'] },
        { resource: 'attendance-report', actions: ['read', 'export'] },
        { resource: 'profile', actions: ['read', 'update'] },
      ],
    },
    {
      name: 'guest',
      description: 'View-only access to public features',
      permissions: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'schedule', actions: ['read'] },
        { resource: 'enhanced-attendance', actions: ['read'] },
      ],
    },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Role>({
    name: '',
    description: '',
    permissions: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // In a real application, you would fetch roles from the backend
  const fetchRoles = async () => {
    setLoading(true);
    try {
      // This would be replaced with an actual API call
      // const response = await axios.get('http://localhost:5001/api/roles');
      // setRoles(response.data.roles);
      
      // For now, we're using the hardcoded roles
      setLoading(false);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch roles',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setCurrentRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: [...role.permissions],
      });
    } else {
      setCurrentRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (role: Role) => {
    setCurrentRole(role);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });
  };

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    const updatedPermissions = [...formData.permissions];
    
    // Check if we already have this resource in permissions
    const resourceIndex = updatedPermissions.findIndex(p => p.resource === resource);
    
    if (resourceIndex >= 0) {
      // Resource exists, update actions
      if (checked) {
        // Add action if not already present
        if (!updatedPermissions[resourceIndex].actions.includes(action)) {
          updatedPermissions[resourceIndex].actions.push(action);
        }
      } else {
        // Remove action
        updatedPermissions[resourceIndex].actions = updatedPermissions[resourceIndex].actions
          .filter(a => a !== action);
        
        // If no actions left, remove the resource
        if (updatedPermissions[resourceIndex].actions.length === 0) {
          updatedPermissions.splice(resourceIndex, 1);
        }
      }
    } else if (checked) {
      // Resource doesn't exist and we're adding a permission
      updatedPermissions.push({
        resource,
        actions: [action],
      });
    }
    
    setFormData({
      ...formData,
      permissions: updatedPermissions,
    });
  };

  const isPermissionChecked = (resource: string, action: string): boolean => {
    const permission = formData.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  };

  const handleSubmit = async () => {
    try {
      // In a real application, you would save to the backend
      // if (currentRole) {
      //   await axios.put(`http://localhost:5001/api/roles/${currentRole.name}`, formData);
      // } else {
      //   await axios.post('http://localhost:5001/api/roles', formData);
      // }
      
      // For now, update the local state
      if (currentRole) {
        setRoles(roles.map(role => 
          role.name === currentRole.name ? { ...formData } : role
        ));
      } else {
        setRoles([...roles, { ...formData }]);
      }
      
      setSnackbar({
        open: true,
        message: `Role ${currentRole ? 'updated' : 'created'} successfully`,
        severity: 'success',
      });
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving role:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${currentRole ? 'update' : 'create'} role`,
        severity: 'error',
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!currentRole) return;
    
    try {
      // In a real application, you would delete from the backend
      // await axios.delete(`http://localhost:5001/api/roles/${currentRole.name}`);
      
      // For now, update the local state
      setRoles(roles.filter(role => role.name !== currentRole.name));
      
      setSnackbar({
        open: true,
        message: 'Role deleted successfully',
        severity: 'success',
      });
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting role:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete role',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2">
          Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.name}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon color="primary" />
                      <Typography variant="h6" component="span">
                        {role.name}
                      </Typography>
                    </Box>
                  }
                  action={
                    <Box>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(role)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(role)}
                        sx={{ ml: 1 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  }
                  subheader={role.description}
                />
                <Divider />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Permissions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {role.permissions.map((permission) => (
                      <Chip
                        key={`${permission.resource}-${permission.actions.join('-')}`}
                        label={
                          permission.resource === '*' 
                            ? 'All Resources' 
                            : `${permission.resource} (${permission.actions.join(', ')})`
                        }
                        color="primary"
                        size="small"
                        icon={<CheckIcon />}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Role Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentRole ? `Edit Role: ${currentRole.name}` : 'Add New Role'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={currentRole !== null} // Don't allow changing role name for existing roles
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />
            
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Permissions
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {availableResources.map((resource) => (
                  <Grid item xs={12} key={resource}>
                    <Typography variant="subtitle2" gutterBottom>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {availableActions.map((action) => (
                        <Box key={`${resource}-${action}`} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={isPermissionChecked(resource, action)}
                            onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                            id={`${resource}-${action}`}
                          />
                          <Typography variant="body2" component="label" htmlFor={`${resource}-${action}`}>
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ mt: 1 }} />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role <strong>{currentRole?.name}</strong>? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Deleting a role may affect users currently assigned to this role.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteRole} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;