export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt?: string;
  lastLogin?: string;
}

export type UserRole = 'guest' | 'user' | 'admin' | 'super_admin';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchToGuest: () => void;
  checkPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// Route permissions configuration
export interface RoutePermission {
  path: string;
  requiredRole?: UserRole;
  requiredPermissions?: { resource: string; action: string }[];
  guestAllowed: boolean;
}

// Default permissions for different roles
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'schedule', actions: ['read'] },
    { resource: 'enhanced-attendance', actions: ['read'] }
  ],
  user: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'schedule', actions: ['read'] },
    { resource: 'enhanced-attendance', actions: ['read', 'export'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read'] }
    // Removed attendance-report resource from user permissions
  ],
  admin: [
    { resource: '*', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'users', actions: ['read', 'create', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create', 'update', 'export'] }
  ],
  super_admin: [
    { resource: '*', actions: ['*'] }
  ]
};

// Route configurations
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/dashboard',
    guestAllowed: true,
    requiredPermissions: [{ resource: 'dashboard', action: 'read' }]
  },
  {
    path: '/schedule',
    guestAllowed: true,
    requiredPermissions: [{ resource: 'schedule', action: 'read' }]
  },
  {
    path: '/enhanced-attendance',
    guestAllowed: true,
    requiredPermissions: [{ resource: 'enhanced-attendance', action: 'read' }]
  },
  {
    path: '/attendance-report',
    guestAllowed: false,
    requiredRole: 'admin',
    requiredPermissions: [{ resource: 'attendance-report', action: 'read' }]
  },
  {
    path: '/reports',
    guestAllowed: false,
    requiredRole: 'user',
    requiredPermissions: [{ resource: 'reports', action: 'read' }]
  },
  {
    path: '/users',
    guestAllowed: false,
    requiredRole: 'admin',
    requiredPermissions: [{ resource: 'users', action: 'read' }]
  },
  {
    path: '/settings',
    guestAllowed: false,
    requiredRole: 'admin',
    requiredPermissions: [{ resource: 'settings', action: 'read' }]
  }
];