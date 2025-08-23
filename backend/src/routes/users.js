const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

/**
 * @route   POST /users
 * @desc    Create a new user (for testing)
 * @access  Public
 */
router.post('/', UserController.createUser);

/**
 * @route   GET /users
 * @desc    Get all users (for testing)
 * @access  Public
 */
router.get('/', UserController.getAllUsers);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', UserController.getUserById);

module.exports = router;
