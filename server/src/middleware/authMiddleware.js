const jwt = require('jsonwebtoken');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Role constants
const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';

/**
 * Authentication Middleware
 * Verifies JWT token and adds user data to request object
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No token provided.' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Invalid token format.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed. Please try again.' 
    });
  }
};

/**
 * Authorization Middleware
 * Checks if the authenticated user has the required role or permission
 * @param {string|string[]} requirements - Required role(s) or permission(s) for access
 */
const authorize = (requirements) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required.' 
        });
      }

      // If requirement contains ':', it's a permission check
      if (typeof requirements === 'string' && requirements.includes(':')) {
        const [resource, action] = requirements.split(':');
        // For admin and super_admin roles, grant all permissions
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
          return next();
        }
        // For other roles, check specific permissions
        const DEFAULT_PERMISSIONS = {
          user: [
            { resource: 'report-generation', actions: ['read'] }
          ],
          admin: [
            { resource: '*', actions: ['*'] },
            { resource: 'report-generation', actions: ['read', 'create'] }
          ],
          super_admin: [
            { resource: '*', actions: ['*'] }
          ]
        };

        const userPermissions = DEFAULT_PERMISSIONS[req.user.role] || [];
        const hasPermission = userPermissions.some(permission => 
          (permission.resource === '*' || permission.resource === resource) &&
          (permission.actions.includes('*') || permission.actions.includes(action))
        );

        if (!hasPermission) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Insufficient permissions.' 
          });
        }
      } else {
        // Role-based check
        const allowedRoles = Array.isArray(requirements) ? requirements : [requirements];
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Insufficient permissions.' 
          });
        }
      }
      
      // If all checks pass, continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization failed. Please try again.' 
      });
    }
  };
};

module.exports = { authenticate, authorize };