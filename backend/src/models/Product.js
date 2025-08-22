const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['eyeglasses', 'sunglasses', 'contact-lenses', 'accessories'],
        lowercase: true
    },
    subcategory: {
        type: String,
        required: [true, 'Subcategory is required'],
        enum: ['men', 'women', 'kids', 'unisex', 'prescription', 'reading', 'computer'],
        lowercase: true
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    price: {
        regular: {
            type: Number,
            required: [true, 'Regular price is required'],
            min: [0, 'Price cannot be negative']
        },
        sale: {
            type: Number,
            min: [0, 'Sale price cannot be negative'],
            validate: {
                validator: function(value) {
                    return !value || value < this.price.regular;
                },
                message: 'Sale price must be less than regular price'
            }
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
        }
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    specifications: {
        frameWidth: {
            type: Number,
            min: [100, 'Frame width must be at least 100mm'],
            max: [200, 'Frame width cannot exceed 200mm']
        },
        lensWidth: {
            type: Number,
            min: [40, 'Lens width must be at least 40mm'],
            max: [80, 'Lens width cannot exceed 80mm']
        },
        bridgeWidth: {
            type: Number,
            min: [10, 'Bridge width must be at least 10mm'],
            max: [30, 'Bridge width cannot exceed 30mm']
        },
        templeLength: {
            type: Number,
            min: [120, 'Temple length must be at least 120mm'],
            max: [160, 'Temple length cannot exceed 160mm']
        },
        frameHeight: {
            type: Number,
            min: [25, 'Frame height must be at least 25mm'],
            max: [70, 'Frame height cannot exceed 70mm']
        },
        weight: {
            type: Number,
            min: [5, 'Weight must be at least 5g'],
            max: [100, 'Weight cannot exceed 100g']
        },
        material: {
            frame: {
                type: String,
                enum: ['acetate', 'metal', 'titanium', 'plastic', 'wood', 'carbon-fiber'],
                required: true
            },
            lens: {
                type: String,
                enum: ['polycarbonate', 'cr-39', 'high-index', 'glass', 'trivex'],
                default: 'polycarbonate'
            }
        },
        frameShape: {
            type: String,
            enum: ['round', 'square', 'oval', 'cat-eye', 'aviator', 'rectangular', 'wayfarer'],
            required: true
        },
        rimType: {
            type: String,
            enum: ['full-rim', 'semi-rim', 'rimless'],
            default: 'full-rim'
        }
    },
    features: [{
        type: String,
        enum: [
            'uv-protection',
            'anti-reflective',
            'blue-light-blocking',
            'photochromic',
            'polarized',
            'scratch-resistant',
            'water-resistant',
            'adjustable-nose-pads',
            'spring-hinges',
            'lightweight'
        ]
    }],
    colors: [{
        name: {
            type: String,
            required: true
        },
        hex: {
            type: String,
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format']
        },
        image: String
    }],
    sizes: [{
        name: {
            type: String,
            enum: ['XS', 'S', 'M', 'L', 'XL'],
            required: true
        },
        frameWidth: Number,
        available: {
            type: Boolean,
            default: true
        }
    }],
    inventory: {
        stock: {
            type: Number,
            required: [true, 'Stock quantity is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        trackInventory: {
            type: Boolean,
            default: true
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued', 'coming-soon'],
        default: 'active'
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    seo: {
        metaTitle: String,
        metaDescription: String,
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        }
    },
    ratings: {
        average: {
            type: Number,
            min: [0, 'Rating cannot be less than 0'],
            max: [5, 'Rating cannot be more than 5'],
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            maxlength: [500, 'Review comment cannot exceed 500 characters']
        },
        verified: {
            type: Boolean,
            default: false
        },
        helpful: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    isNewArrival: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    purchaseCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for current price (sale price if available, otherwise regular price)
productSchema.virtual('currentPrice').get(function() {
    return this.price.sale || this.price.regular;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.price.sale && this.price.regular > this.price.sale) {
        return Math.round(((this.price.regular - this.price.sale) / this.price.regular) * 100);
    }
    return 0;
});

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
    return this.status === 'active' && this.inventory.stock > 0;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
    return this.inventory.stock <= this.inventory.lowStockThreshold;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary || this.images[0] || null;
});

// Indexes for better query performance
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ 'price.regular': 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ status: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'seo.slug': 1 });

// Text index for search functionality
productSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    tags: 'text'
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (this.isModified('name') || !this.seo.slug) {
        this.seo.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
    if (this.images && this.images.length > 0) {
        const primaryImages = this.images.filter(img => img.isPrimary);
        if (primaryImages.length > 1) {
            // Keep only the first primary image
            this.images.forEach((img, index) => {
                if (index > 0 && img.isPrimary) {
                    img.isPrimary = false;
                }
            });
        } else if (primaryImages.length === 0) {
            // Set first image as primary if none is set
            this.images[0].isPrimary = true;
        }
    }
    next();
});

// Method to add review and update ratings
productSchema.methods.addReview = function(userId, rating, comment) {
    this.reviews.push({
        user: userId,
        rating: rating,
        comment: comment,
        verified: false // Set to true if user has purchased this product
    });
    
    // Recalculate average rating
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / this.reviews.length;
    this.ratings.count = this.reviews.length;
    
    return this.save();
};

// Method to increment view count
productSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Static method to get featured products
productSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ isFeatured: true, status: 'active' })
        .limit(limit)
        .sort({ createdAt: -1 });
};

// Static method to get new arrivals
productSchema.statics.getNewArrivals = function(limit = 10) {
    return this.find({ isNewArrival: true, status: 'active' })
        .limit(limit)
        .sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}) {
    const searchQuery = {
        $text: { $search: query },
        status: 'active',
        ...filters
    };
    
    return this.find(searchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Product', productSchema);
