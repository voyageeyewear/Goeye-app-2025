const Story = require('../models/Story');
const Media = require('../models/Media');
const User = require('../models/User');
const MediaService = require('../services/mediaService');

class StoryController {
  /**
   * Create a new story
   * POST /stories
   */
  static async createStory(req, res) {
    try {
      const { title, description } = req.body;
      const userId = req.user?.id || req.body.userId; // For testing, allow userId in body

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create story
      const story = new Story({
        userId,
        title: title || 'Untitled Story',
        description: description || ''
      });

      await story.save();

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        data: {
          storyId: story._id,
          userId: story.userId,
          title: story.title,
          description: story.description,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          media: []
        }
      });

    } catch (error) {
      console.error('Error creating story:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add media to a story
   * POST /stories/:id/media
   */
  static async addMediaToStory(req, res) {
    try {
      const { id } = req.params;
      const files = req.files || [req.file];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No media files provided'
        });
      }

      // Find story
      const story = await Story.findById(id);
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Check if story is expired
      if (story.isExpired) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add media to expired story'
        });
      }

      const mediaItems = [];
      const mediaCount = await Media.getMediaCountByStory(id);

      // Process each uploaded file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Process media file
          const mediaInfo = await MediaService.processMedia(file);
          
          // Create media record
          const media = new Media({
            storyId: id,
            type: mediaInfo.type,
            url: mediaInfo.url,
            thumbnailUrl: mediaInfo.thumbnailUrl,
            filename: mediaInfo.filename,
            originalName: mediaInfo.originalName,
            mimeType: mediaInfo.mimeType,
            size: mediaInfo.size,
            duration: mediaInfo.duration,
            width: mediaInfo.width,
            height: mediaInfo.height,
            order: mediaCount + i
          });

          await media.save();
          mediaItems.push({
            mediaId: media._id,
            type: media.type,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            order: media.order
          });

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          // Continue with other files even if one fails
        }
      }

      // Update story media count
      story.mediaCount = await Media.getMediaCountByStory(id);
      await story.save();

      res.status(201).json({
        success: true,
        message: 'Media added to story successfully',
        data: {
          storyId: id,
          mediaCount: story.mediaCount,
          media: mediaItems
        }
      });

    } catch (error) {
      console.error('Error adding media to story:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all stories with pagination
   * GET /stories
   */
  static async getAllStories(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const userId = req.query.userId;

      let stories;
      let totalCount;

      if (userId) {
        // Get stories for specific user
        stories = await Story.getActiveStoriesByUser(userId, page, limit);
        totalCount = await Story.countDocuments({
          userId,
          isActive: true,
          expiresAt: { $gt: new Date() }
        });
      } else {
        // Get all active stories
        stories = await Story.getAllActiveStories(page, limit);
        totalCount = await Story.countDocuments({
          isActive: true,
          expiresAt: { $gt: new Date() }
        });
      }

      // Get media for each story
      const storiesWithMedia = await Promise.all(
        stories.map(async (story) => {
          const media = await Media.getMediaByStory(story._id);
          return {
            storyId: story._id,
            userId: story.userId,
            title: story.title,
            description: story.description,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            viewCount: story.viewCount,
            mediaCount: story.mediaCount,
            user: {
              username: story.userId.username,
              profilePicture: story.userId.profilePicture
            },
            media: media.map(m => ({
              mediaId: m._id,
              type: m.type,
              url: m.url,
              thumbnailUrl: m.thumbnailUrl,
              order: m.order
            }))
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          stories: storiesWithMedia,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }
        }
      });

    } catch (error) {
      console.error('Error fetching stories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a single story with all its media
   * GET /stories/:id
   */
  static async getStoryById(req, res) {
    try {
      const { id } = req.params;

      const story = await Story.findById(id)
        .populate('userId', 'username profilePicture');

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Increment view count
      await story.incrementViewCount();

      // Get media for the story
      const media = await Media.getMediaByStory(id);

      res.json({
        success: true,
        data: {
          storyId: story._id,
          userId: story.userId,
          title: story.title,
          description: story.description,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          viewCount: story.viewCount + 1, // Include the current view
          mediaCount: story.mediaCount,
          isExpired: story.isExpired,
          user: {
            username: story.userId.username,
            profilePicture: story.userId.profilePicture
          },
          media: media.map(m => ({
            mediaId: m._id,
            type: m.type,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            order: m.order,
            duration: m.duration
          }))
        }
      });

    } catch (error) {
      console.error('Error fetching story:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete a story and all its media
   * DELETE /stories/:id
   */
  static async deleteStory(req, res) {
    try {
      const { id } = req.params;

      const story = await Story.findById(id);
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Get all media for the story
      const media = await Media.find({ storyId: id });

      // Delete media files
      for (const mediaItem of media) {
        await MediaService.deleteMedia(mediaItem.filename);
      }

      // Delete media records
      await Media.deleteMany({ storyId: id });

      // Delete story
      await Story.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Story deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting story:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete a specific media item from a story
   * DELETE /stories/:id/media/:mediaId
   */
  static async deleteMedia(req, res) {
    try {
      const { id, mediaId } = req.params;

      // Check if story exists
      const story = await Story.findById(id);
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Find and delete media
      const media = await Media.findById(mediaId);
      if (!media || media.storyId.toString() !== id) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      // Delete media file
      await MediaService.deleteMedia(media.filename);

      // Delete media record
      await Media.findByIdAndDelete(mediaId);

      // Update story media count
      story.mediaCount = await Media.getMediaCountByStory(id);
      await story.save();

      res.json({
        success: true,
        message: 'Media deleted successfully',
        data: {
          storyId: id,
          mediaCount: story.mediaCount
        }
      });

    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = StoryController;
