const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Authentication types
const AUTH_TYPE_LOCAL = 'local';

/**
 * Authentication Service
 * Handles user authentication, login, and token management
 */
class AuthService {
  /**
   * Authenticate a user with username and password
   * @param {string} username - The username
   * @param {string} password - The password
   * @returns {Promise<Object>} - User data with token if authentication successful
   */
  async login(username, password) {
    try {
      const pool = await poolPromise;
      
      // Find user by username
      const userQuery = `
        SELECT id, username, password, role, approved, authentication_type 
        FROM users 
        WHERE username = @username AND authentication_type = @authType
      `;
      
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('authType', sql.VarChar, AUTH_TYPE_LOCAL)
        .query(userQuery);
      
      // Check if user exists
      if (result.recordset.length === 0) {
        return { success: false, message: 'Invalid username or password' };
      }
      
      const user = result.recordset[0];
      
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return { success: false, message: 'Invalid username or password' };
      }
      
      // Check if user is approved
      if (user.approved !== true && user.approved !== 1) {
        return { success: false, message: 'Account is pending approval' };
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Return user data (excluding password) and token
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          authType: user.authentication_type
        },
        token
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Authentication failed', error: error.message };
    }
  }
  
  /**
   * Get user by ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} - User data
   */
  async getUserById(userId) {
    try {
      const pool = await poolPromise;
      
      const userQuery = `
        SELECT id, username, role, approved, authentication_type 
        FROM users 
        WHERE id = @userId
      `;
      
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(userQuery);
      
      if (result.recordset.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      return { success: true, user: result.recordset[0] };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, message: 'Failed to get user', error: error.message };
    }
  }
  
  /**
   * Change user password
   * @param {number} userId - The user ID
   * @param {string} currentPassword - The current password
   * @param {string} newPassword - The new password
   * @returns {Promise<Object>} - Result of password change
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const pool = await poolPromise;
      
      // Get current user data
      const userQuery = `
        SELECT id, password, authentication_type 
        FROM users 
        WHERE id = @userId
      `;
      
      const userResult = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query(userQuery);
      
      if (userResult.recordset.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = userResult.recordset[0];
      
      // Only local authentication users can change password
      if (user.authentication_type !== AUTH_TYPE_LOCAL) {
        return { success: false, message: 'Password change not available for this authentication type' };
      }
      
      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!passwordMatch) {
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      const updateQuery = `
        UPDATE users 
        SET password = @password
        WHERE id = @userId
      `;
      
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('password', sql.NVarChar, hashedPassword)
        .query(updateQuery);
      
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Failed to change password', error: error.message };
    }
  }
}

module.exports = new AuthService();