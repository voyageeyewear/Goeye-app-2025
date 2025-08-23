const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds for videos
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mediaSchema.index({ storyId: 1, order: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ isActive: 1 });

// Static method to get media for a story
mediaSchema.statics.getMediaByStory = function(storyId) {
  return this.find({
    storyId,
    isActive: true
  })
  .sort({ order: 1, createdAt: 1 });
};

// Static method to get media count for a story
mediaSchema.statics.getMediaCountByStory = function(storyId) {
  return this.countDocuments({
    storyId,
    isActive: true
  });
};

// Method to update order
mediaSchema.methods.updateOrder = function(newOrder) {
  this.order = newOrder;
  return this.save();
};

module.exports = mongoose.model('Media', mediaSchema);
