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
 * Role-based Authorization Middleware
 * Checks if the authenticated user has the required role
 * @param {string|string[]} roles - Required role(s) for access
 */
const authorize = (roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required.' 
        });
      }
      
      // Convert roles to array if it's a single string
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      
      // User has required role, continue
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

module.exports = {
  authenticate,
  authorize
};