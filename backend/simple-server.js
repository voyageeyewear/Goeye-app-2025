require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Eyejack Backend Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Backend root endpoint
app.get('/backend', (req, res) => {
    res.status(200).json({
        message: '👓 Welcome to Eyejack Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            auth: '/api/v1/auth',
            products: '/api/v1/products',
            cart: '/api/v1/cart',
            orders: '/api/v1/orders',
            wishlist: '/api/v1/wishlist'
        },
        documentation: '/api/v1/docs'
    });
});

// Sample API endpoints
app.get('/api/v1/products', (req, res) => {
    res.json({
        success: true,
        data: {
            products: [
                {
                    id: '1',
                    name: 'Black Dashers',
                    price: 64,
                    category: 'eyeglasses',
                    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'
                },
                {
                    id: '2',
                    name: 'Pink Dashers',
                    price: 95,
                    category: 'eyeglasses',
                    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                }
            ]
        }
    });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: '1',
                email: email || 'user@example.com',
                firstName: 'John',
                lastName: 'Doe'
            },
            token: 'sample_jwt_token_for_development'
        }
    });
});

app.get('/api/v1/cart', (req, res) => {
    res.json({
        success: true,
        data: {
            cart: {
                items: [],
                total: 0,
                itemCount: 0
            }
        }
    });
});

// API Documentation endpoint
app.get('/api/v1/docs', (req, res) => {
    res.json({
        title: 'Eyejack Backend API Documentation',
        version: '1.0.0',
        description: 'Complete e-commerce backend for Eyejack Mobile App',
        baseUrl: `http://localhost:${PORT}`,
        endpoints: {
            'GET /health': 'Health check',
            'GET /backend': 'API information',
            'GET /api/v1/products': 'Get all products',
            'POST /api/v1/auth/login': 'User login',
            'GET /api/v1/cart': 'Get user cart'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: ['/health', '/backend', '/api/v1/docs']
    });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`
🚀 Eyejack Backend Server Started Successfully!
📍 Server running on: http://localhost:${PORT}
🌐 Backend endpoint: http://localhost:${PORT}/backend
📚 API Documentation: http://localhost:${PORT}/api/v1/docs
🏥 Health check: http://localhost:${PORT}/health
🌍 Environment: ${process.env.NODE_ENV || 'development'}
    `);
});

module.exports = app;
