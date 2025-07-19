import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  AuthState, 
  AuthContextType, 
  User, 
  LoginCredentials, 
  UserRole, 
  DEFAULT_PERMISSIONS 
} from '@/types/auth';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('auth_user');
        const savedToken = localStorage.getItem('auth_token');
        
        if (savedUser && savedToken) {
          const user = JSON.parse(savedUser);
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } else {
          // Default to guest mode if no saved auth
          dispatch({ type: 'SWITCH_TO_GUEST' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'SWITCH_TO_GUEST' });
      }
    };

    initializeAuth();
  }, []);

  // Login function (will be connected to backend later)
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // For now, simulate login with mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock user data - replace with actual API response
      const mockUser: User = {
        id: '1',
        username: credentials.username,
        email: `${credentials.username}@company.com`,
        role: 'user',
        permissions: DEFAULT_PERMISSIONS.user,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'mock_jwt_token');
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  };

  // Switch to guest mode
  const switchToGuest = (): void => {
    localStorage.removeItem('auth_user');
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