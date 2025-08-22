const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Sample wishlist storage for development
let sampleWishlists = {};

// @route   GET /api/v1/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const wishlist = sampleWishlists[req.user.id] || {
            user: req.user.id,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        res.json({
            success: true,
            data: { wishlist }
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving wishlist'
        });
    }
});

// @route   POST /api/v1/wishlist/add
// @desc    Add item to wishlist
// @access  Private
router.post('/add', auth, [
    body('productId').notEmpty().withMessage('Product ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { productId } = req.body;

        if (!sampleWishlists[req.user.id]) {
            sampleWishlists[req.user.id] = {
                user: req.user.id,
                items: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        const wishlist = sampleWishlists[req.user.id];

        // Check if item already exists
        const existingItem = wishlist.items.find(item => item.productId === productId);
        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Item already in wishlist'
            });
        }

        // Add item to wishlist
        wishlist.items.push({
            productId,
            addedAt: new Date()
        });
        wishlist.updatedAt = new Date();

        res.json({
            success: true,
            message: 'Item added to wishlist successfully',
            data: { wishlist }
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding item to wishlist'
        });
    }
});

// @route   DELETE /api/v1/wishlist/remove/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!sampleWishlists[req.user.id]) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        const wishlist = sampleWishlists[req.user.id];
        wishlist.items = wishlist.items.filter(item => item.productId !== productId);
        wishlist.updatedAt = new Date();

        res.json({
            success: true,
            message: 'Item removed from wishlist successfully',
            data: { wishlist }
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing item from wishlist'
        });
    }
});

module.exports = router;
