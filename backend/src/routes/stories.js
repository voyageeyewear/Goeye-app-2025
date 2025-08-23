const express = require('express');
const router = express.Router();
const StoryController = require('../controllers/storyController');
const { uploadMultiple, uploadSingle, handleUploadError } = require('../middleware/upload');

/**
 * @route   POST /stories
 * @desc    Create a new story
 * @access  Public (for testing, in production should be private)
 */
router.post('/', StoryController.createStory);

/**
 * @route   POST /stories/:id/media
 * @desc    Add media to a story (supports multiple files)
 * @access  Public (for testing, in production should be private)
 */
router.post('/:id/media', uploadMultiple, handleUploadError, StoryController.addMediaToStory);

/**
 * @route   GET /stories
 * @desc    Get all stories with pagination
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20)
 * @query   userId - Filter by user ID (optional)
 */
router.get('/', StoryController.getAllStories);

/**
 * @route   GET /stories/:id
 * @desc    Get a single story with all its media
 * @access  Public
 */
router.get('/:id', StoryController.getStoryById);

/**
 * @route   DELETE /stories/:id
 * @desc    Delete a story and all its media
 * @access  Public (for testing, in production should be private)
 */
router.delete('/:id', StoryController.deleteStory);

/**
 * @route   DELETE /stories/:id/media/:mediaId
 * @desc    Delete a specific media item from a story
 * @access  Public (for testing, in production should be private)
 */
router.delete('/:id/media/:mediaId', StoryController.deleteMedia);

module.exports = router;
