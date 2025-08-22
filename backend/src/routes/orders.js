const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Sample orders for development
let sampleOrders = [];

// @route   POST /api/v1/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
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

        const { items, shippingAddress, paymentMethod, notes } = req.body;

        // Create sample order
        const order = {
            id: `ORD-${Date.now()}`,
            user: req.user.id,
            items,
            shippingAddress,
            paymentMethod,
            notes,
            status: 'pending',
            totals: {
                subtotal: 159,
                tax: 13.52,
                shipping: 0,
                total: 172.52
            },
            createdAt: new Date(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        sampleOrders.push(order);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating order'
        });
    }
});

// @route   GET /api/v1/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userOrders = sampleOrders.filter(order => order.user === req.user.id);

        res.json({
            success: true,
            data: {
                orders: userOrders,
                total: userOrders.length
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving orders'
        });
    }
});

// @route   GET /api/v1/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = sampleOrders.find(order => 
            order.id === id && order.user === req.user.id
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: { order }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving order'
        });
    }
});

module.exports = router;
