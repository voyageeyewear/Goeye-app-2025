const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Stories expire after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  mediaCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ isActive: 1 });

// Virtual for checking if story is expired
storySchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Method to increment view count
storySchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to get active stories for a user
storySchema.statics.getActiveStoriesByUser = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('userId', 'username profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get all active stories with pagination
storySchema.statics.getAllActiveStories = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('userId', 'username profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

module.exports = mongoose.model('Story', storySchema);
