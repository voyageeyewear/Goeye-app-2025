require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import database connection (commented out for development)
// const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Connect to database (commented out for development)
// connectDB();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

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
        endpoints: {
            health: '/health',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            products: '/api/v1/products',
            cart: '/api/v1/cart',
            orders: '/api/v1/orders',
            wishlist: '/api/v1/wishlist'
        },
        documentation: '/api/v1/docs'
    });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/cart`, cartRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/wishlist`, wishlistRoutes);

// API Documentation endpoint
app.get(`${apiPrefix}/docs`, (req, res) => {
    res.status(200).json({
        title: 'Eyejack Backend API Documentation',
        version: '1.0.0',
        description: 'Complete e-commerce backend for Eyejack Mobile App',
        baseUrl: process.env.BASE_URL || 'http://localhost:3001',
        endpoints: {
            authentication: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                logout: 'POST /api/v1/auth/logout',
                refresh: 'POST /api/v1/auth/refresh',
                forgotPassword: 'POST /api/v1/auth/forgot-password',
                resetPassword: 'POST /api/v1/auth/reset-password'
            },
            users: {
                profile: 'GET /api/v1/users/profile',
                updateProfile: 'PUT /api/v1/users/profile',
                uploadAvatar: 'POST /api/v1/users/avatar'
            },
            products: {
                getAllProducts: 'GET /api/v1/products',
                getProduct: 'GET /api/v1/products/:id',
                searchProducts: 'GET /api/v1/products/search?q=query',
                getCategories: 'GET /api/v1/products/categories',
                getFeatured: 'GET /api/v1/products/featured'
            },
            cart: {
                getCart: 'GET /api/v1/cart',
                addToCart: 'POST /api/v1/cart/add',
                updateQuantity: 'PUT /api/v1/cart/update',
                removeItem: 'DELETE /api/v1/cart/remove/:productId',
                clearCart: 'DELETE /api/v1/cart/clear'
            },
            orders: {
                createOrder: 'POST /api/v1/orders',
                getOrders: 'GET /api/v1/orders',
                getOrder: 'GET /api/v1/orders/:id',
                updateOrderStatus: 'PUT /api/v1/orders/:id/status'
            },
            wishlist: {
                getWishlist: 'GET /api/v1/wishlist',
                addToWishlist: 'POST /api/v1/wishlist/add',
                removeFromWishlist: 'DELETE /api/v1/wishlist/remove/:productId'
            }
        }
    });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
