import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  AuthState, 
  AuthContextType, 
  User, 
  LoginCredentials, 
  UserRole, 
  DEFAULT_PERMISSIONS 
} from '@/types/auth';
import axios from 'axios';

// API configuration
const API_URL = 'http://localhost:5001/api';
const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  CHECK: `${API_URL}/auth/check`,
  ME: `${API_URL}/auth/me`,
};

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_TO_GUEST' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SWITCH_TO_GUEST':
      return {
        ...state,
        user: {
          id: 'guest',
          username: 'Guest User',
          role: 'guest',
          permissions: DEFAULT_PERMISSIONS.guest,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Setup axios interceptor for authentication
const setupAxiosInterceptors = (token: string) => {
  axios.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const savedToken = localStorage.getItem('auth_token');
        
        if (savedToken) {
          // Setup axios with the saved token
          setupAxiosInterceptors(savedToken);
          
          // Verify token validity with the server
          const response = await axios.get(AUTH_ENDPOINTS.CHECK);
          
          if (response.data.success) {
            // Map the API response to our User type
            const userData: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              role: response.data.user.role as UserRole,
              // For now, use default permissions based on role
              permissions: DEFAULT_PERMISSIONS[response.data.user.role as UserRole] || [],
            };
            
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
          } else {
            // Token invalid, switch to guest
            localStorage.removeItem('auth_token');
            dispatch({ type: 'SWITCH_TO_GUEST' });
          }
        } else {
          // No token, switch to guest
          dispatch({ type: 'SWITCH_TO_GUEST' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('auth_token');
        dispatch({ type: 'SWITCH_TO_GUEST' });
      }
    };

    initializeAuth();
  }, []);

  // Login function connected to the backend API
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Call the login API
      const response = await axios.post(AUTH_ENDPOINTS.LOGIN, credentials);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('auth_token', token);
        
        // Setup axios interceptor with the new token
        setupAxiosInterceptors(token);
        
        // Map the API response to our User type
        const userData: User = {
          id: user.id,
          username: user.username,
          role: user.role as UserRole,
          // For now, use default permissions based on role
          permissions: DEFAULT_PERMISSIONS[user.role as UserRole] || [],
        };
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message || 'Login failed' });
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  };

  // Switch to guest mode
  const switchToGuest = (): void => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'SWITCH_TO_GUEST' });
  };

  // Check if user has specific permission
  const checkPermission = (resource: string, action: string): boolean => {
    if (!state.user) return false;
    
    // Super admin has all permissions
    if (state.user.role === 'super_admin') return true;
    
    // Check if user has wildcard permissions
    const wildcardPermission = state.user.permissions.find(p => p.resource === '*');
    if (wildcardPermission && (wildcardPermission.actions.includes('*') || wildcardPermission.actions.includes(action))) {
      return true;
    }
    
    // Check specific resource permission
    const permission = state.user.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) || permission.actions.includes('*') : false;
  };

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      user: 1,
      admin: 2,
      super_admin: 3,
    };
    
    return roleHierarchy[state.user.role] >= roleHierarchy[role];
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    switchToGuest,
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};