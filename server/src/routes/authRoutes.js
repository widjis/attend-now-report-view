const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Authenticate user
    const result = await authService.login(username, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user data
 * @access Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const result = await authService.getUserById(userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while retrieving user data' 
    });
  }
});

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters long' 
      });
    }
    
    // Change password
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while changing password' 
    });
  }
});

/**
 * @route GET /api/auth/check
 * @desc Check if user is authenticated
 * @access Private
 */
router.get('/check', authenticate, (req, res) => {
  return res.json({ 
    success: true, 
    message: 'User is authenticated',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

module.exports = router;