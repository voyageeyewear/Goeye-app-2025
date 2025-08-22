const express = require('express');
const { body, validationResult } = require('express-validator');
// const Cart = require('../models/Cart'); // Commented for development
// const Product = require('../models/Product'); // Commented for development
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOrCreateForUser(req.user.id);
        await cart.populate('items.product');

        res.json({
            success: true,
            data: { cart }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving cart'
        });
    }
});

// @route   POST /api/v1/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
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

        const { productId, quantity, selectedColor, selectedSize, customizations } = req.body;

        // For development, use sample price
        const priceAtTime = productId === 'BD001' ? 64 : 95;

        const cart = await Cart.findOrCreateForUser(req.user.id);
        
        await cart.addItem(productId, quantity, {
            selectedColor,
            selectedSize,
            customizations,
            priceAtTime
        });

        await cart.populate('items.product');

        res.json({
            success: true,
            message: 'Item added to cart successfully',
            data: { cart }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding item to cart'
        });
    }
});

// @route   PUT /api/v1/cart/update
// @desc    Update cart item quantity
// @access  Private
router.put('/update', auth, [
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10')
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

        const { itemId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.updateItemQuantity(itemId, quantity);
        await cart.populate('items.product');

        res.json({
            success: true,
            message: 'Cart updated successfully',
            data: { cart }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating cart'
        });
    }
});

// @route   DELETE /api/v1/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', auth, async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.removeItem(itemId);
        await cart.populate('items.product');

        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            data: { cart }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing item from cart'
        });
    }
});

// @route   DELETE /api/v1/cart/clear
// @desc    Clear cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.clearCart();

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: { cart }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error clearing cart'
        });
    }
});

module.exports = router;
