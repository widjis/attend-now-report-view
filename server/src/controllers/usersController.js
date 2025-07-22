const { poolPromise, sql } = require('../config/db');

/**
 * Users Controller
 * Handles operations related to user management
 */

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query to get all users
    const result = await pool.request()
      .query(`
        SELECT 
          id, 
          username, 
          role, 
          approved,
          authentication_type
        FROM users
        ORDER BY username
      `);
    
    res.status(200).json({
      success: true,
      users: result.recordset
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query(`
        SELECT 
          id, 
          username, 
          role, 
          approved,
          authentication_type
        FROM users
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: result.recordset[0]
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, approved = 1, authentication_type = 'local' } = req.body;
    
    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }
    
    const pool = await poolPromise;
    
    // Check if username already exists
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM users WHERE username = @username');
    
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role)
      .input('approved', sql.Bit, approved)
      .input('authentication_type', sql.VarChar, authentication_type)
      .query(`
        INSERT INTO users (username, password, role, approved, authentication_type)
        VALUES (@username, @password, @role, @approved, @authentication_type);
        
        SELECT 
          id, 
          username, 
          role, 
          approved,
          authentication_type
        FROM users
        WHERE username = @username;
      `);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.recordset[0]
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, approved, authentication_type } = req.body;
    
    const pool = await poolPromise;
    
    // Check if user exists
    const checkUser = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM users WHERE id = @id');
    
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build update query dynamically based on provided fields
    let updateQuery = 'UPDATE users SET ';
    const updateFields = [];
    const request = pool.request().input('id', sql.NVarChar, id);
    
    if (username) {
      updateFields.push('username = @username');
      request.input('username', sql.NVarChar, username);
    }
    
    if (password) {
      // Hash password
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      updateFields.push('password = @password');
      request.input('password', sql.NVarChar, hashedPassword);
    }
    
    if (role) {
      updateFields.push('role = @role');
      request.input('role', sql.NVarChar, role);
    }
    
    if (approved !== undefined) {
      updateFields.push('approved = @approved');
      request.input('approved', sql.Bit, approved);
    }
    
    if (authentication_type) {
      updateFields.push('authentication_type = @authentication_type');
      request.input('authentication_type', sql.VarChar, authentication_type);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ' WHERE id = @id';
    
    // Execute update
    await request.query(updateQuery);
    
    // Get updated user
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query(`
        SELECT 
          id, 
          username, 
          role, 
          approved, 
          authentication_type
        FROM users
        WHERE id = @id
      `);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: result.recordset[0]
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if user exists
    const checkUser = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM users WHERE id = @id');
    
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM users WHERE id = @id');
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};