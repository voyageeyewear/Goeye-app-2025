const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [10, 'Quantity cannot exceed 10']
    },
    selectedColor: {
        name: String,
        hex: String
    },
    selectedSize: {
        name: String,
        frameWidth: Number
    },
    customizations: {
        lensType: {
            type: String,
            enum: ['standard', 'blue-light', 'photochromic', 'polarized'],
            default: 'standard'
        },
        prescription: {
            hasRx: {
                type: Boolean,
                default: false
            },
            rightEye: {
                sphere: Number,
                cylinder: Number,
                axis: Number,
                add: Number
            },
            leftEye: {
                sphere: Number,
                cylinder: Number,
                axis: Number,
                add: Number
            },
            pupillaryDistance: Number
        },
        coating: {
            type: String,
            enum: ['none', 'anti-reflective', 'scratch-resistant', 'uv-protection'],
            default: 'none'
        }
    },
    priceAtTime: {
        type: Number,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totals: {
        subtotal: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    appliedCoupons: [{
        code: {
            type: String,
            required: true
        },
        discountAmount: {
            type: Number,
            required: true
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true
        }
    }],
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User.addresses'
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    sessionId: {
        type: String,
        index: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60 // 30 days
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
cartSchema.virtual('uniqueItemCount').get(function() {
    return this.items.length;
});

// Virtual for cart weight (for shipping calculations)
cartSchema.virtual('totalWeight').get(function() {
    return this.items.reduce((total, item) => {
        const weight = item.product?.specifications?.weight || 20; // Default 20g
        return total + (weight * item.quantity);
    }, 0);
});

// Index for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ updatedAt: -1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
    this.calculateTotals();
    next();
});

// Method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
    // Calculate subtotal
    this.totals.subtotal = this.items.reduce((total, item) => {
        return total + (item.priceAtTime * item.quantity);
    }, 0);
    
    // Calculate tax (8.5% for example)
    const taxRate = 0.085;
    this.totals.tax = Math.round(this.totals.subtotal * taxRate * 100) / 100;
    
    // Calculate shipping (free over $100, otherwise $9.99)
    this.totals.shipping = this.totals.subtotal >= 100 ? 0 : 9.99;
    
    // Apply discounts
    this.totals.discount = this.appliedCoupons.reduce((total, coupon) => {
        if (coupon.discountType === 'percentage') {
            return total + (this.totals.subtotal * coupon.discountAmount / 100);
        } else {
            return total + coupon.discountAmount;
        }
    }, 0);
    
    // Calculate final total
    this.totals.total = Math.max(0, 
        this.totals.subtotal + 
        this.totals.tax + 
        this.totals.shipping - 
        this.totals.discount
    );
    
    // Round to 2 decimal places
    Object.keys(this.totals).forEach(key => {
        this.totals[key] = Math.round(this.totals[key] * 100) / 100;
    });
};

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, options = {}) {
    const existingItemIndex = this.items.findIndex(item => 
        item.product.toString() === productId.toString() &&
        JSON.stringify(item.selectedColor) === JSON.stringify(options.selectedColor) &&
        JSON.stringify(item.selectedSize) === JSON.stringify(options.selectedSize)
    );
    
    if (existingItemIndex > -1) {
        // Update existing item quantity
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].quantity = Math.min(
            this.items[existingItemIndex].quantity, 
            10
        ); // Max 10 items
    } else {
        // Add new item
        this.items.push({
            product: productId,
            quantity: quantity,
            selectedColor: options.selectedColor,
            selectedSize: options.selectedSize,
            customizations: options.customizations || {},
            priceAtTime: options.priceAtTime
        });
    }
    
    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
    const item = this.items.id(itemId);
    if (item) {
        if (quantity <= 0) {
            this.items.pull(itemId);
        } else {
            item.quantity = Math.min(quantity, 10); // Max 10 items
        }
        return this.save();
    }
    throw new Error('Item not found in cart');
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
    this.items.pull(itemId);
    return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.appliedCoupons = [];
    return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discountAmount, discountType) {
    // Check if coupon already applied
    const existingCoupon = this.appliedCoupons.find(c => c.code === couponCode);
    if (existingCoupon) {
        throw new Error('Coupon already applied');
    }
    
    this.appliedCoupons.push({
        code: couponCode,
        discountAmount: discountAmount,
        discountType: discountType
    });
    
    return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function(couponCode) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== couponCode);
    return this.save();
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId, sessionId = null) {
    let cart = await this.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
        cart = new this({
            user: userId,
            sessionId: sessionId,
            items: []
        });
        await cart.save();
    }
    
    return cart;
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function(userId, guestSessionId) {
    const userCart = await this.findOne({ user: userId });
    const guestCart = await this.findOne({ sessionId: guestSessionId });
    
    if (guestCart && guestCart.items.length > 0) {
        if (userCart) {
            // Merge items from guest cart to user cart
            for (const guestItem of guestCart.items) {
                await userCart.addItem(
                    guestItem.product,
                    guestItem.quantity,
                    {
                        selectedColor: guestItem.selectedColor,
                        selectedSize: guestItem.selectedSize,
                        customizations: guestItem.customizations,
                        priceAtTime: guestItem.priceAtTime
                    }
                );
            }
            
            // Delete guest cart
            await guestCart.deleteOne();
            return userCart;
        } else {
            // Convert guest cart to user cart
            guestCart.user = userId;
            guestCart.sessionId = null;
            return await guestCart.save();
        }
    }
    
    return userCart || await this.findOrCreateForUser(userId);
};

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() },
        user: { $exists: false }
    });
};

module.exports = mongoose.model('Cart', cartSchema);
