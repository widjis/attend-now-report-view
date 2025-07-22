const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), getUsers);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Admin only)
 */
router.get('/:id', authenticate, authorize('admin'), getUserById);

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (Admin only)
 */
router.post('/', authenticate, authorize('admin'), createUser);

/**
 * @route PUT /api/users/:id
 * @desc Update a user
 * @access Private (Admin only)
 */
router.put('/:id', authenticate, authorize('admin'), updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Delete a user
 * @access Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;