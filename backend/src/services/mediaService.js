const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { thumbnailsDir } = require('../middleware/upload');

class MediaService {
  /**
   * Process uploaded image and create thumbnail
   * @param {string} filePath - Path to the uploaded file
   * @param {string} filename - Original filename
   * @returns {Object} - Media info with dimensions and thumbnail
   */
  static async processImage(filePath, filename) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Create thumbnail
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      
      await image
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      return {
        type: 'image',
        width: metadata.width,
        height: metadata.height,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        duration: 0
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Process uploaded video and create thumbnail
   * @param {string} filePath - Path to the uploaded file
   * @param {string} filename - Original filename
   * @returns {Object} - Media info with dimensions and thumbnail
   */
  static async processVideo(filePath, filename) {
    try {
      // For video processing, we'll use a simple approach
      // In production, you might want to use ffmpeg for better video processing
      const thumbnailFilename = `thumb_${path.parse(filename).name}.jpg`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      
      // Create a simple thumbnail (you can enhance this with ffmpeg)
      // For now, we'll create a placeholder
      await sharp({
        create: {
          width: 300,
          height: 300,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      })
      .jpeg()
      .toFile(thumbnailPath);
      
      return {
        type: 'video',
        width: 1920, // Default video dimensions
        height: 1080,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        duration: 0 // You can extract this with ffmpeg
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error('Failed to process video');
    }
  }

  /**
   * Process uploaded media file
   * @param {Object} file - Multer file object
   * @returns {Object} - Processed media info
   */
  static async processMedia(file) {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (!isImage && !isVideo) {
      throw new Error('Unsupported file type');
    }
    
    const mediaInfo = isImage 
      ? await this.processImage(file.path, file.filename)
      : await this.processVideo(file.path, file.filename);
    
    return {
      ...mediaInfo,
      url: `/uploads/stories/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  /**
   * Delete media file and its thumbnail
   * @param {string} filename - Filename to delete
   */
  static async deleteMedia(filename) {
    try {
      const filePath = path.join(__dirname, '../../uploads/stories', filename);
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', `thumb_${filename}`);
      
      // Delete main file
      await fs.unlink(filePath).catch(() => {});
      
      // Delete thumbnail
      await fs.unlink(thumbnailPath).catch(() => {});
      
    } catch (error) {
      console.error('Error deleting media file:', error);
    }
  }

  /**
   * Get file type from mimetype
   * @param {string} mimetype - File mimetype
   * @returns {string} - File type (image or video)
   */
  static getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    throw new Error('Unsupported file type');
  }
}

module.exports = MediaService;
