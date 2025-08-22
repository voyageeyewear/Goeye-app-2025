require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const EventEmitter = require('eventemitter3');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Serve mobile app from parent directory
app.use(express.static(path.join(__dirname, '../../public')));

// Specific routes for main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/mobile-app.html'));
});

app.get('/mobile-app.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/mobile-app.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Initialize Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Make io available to routes
app.set('io', io);

// Global event emitter for internal communication
const globalEvents = new EventEmitter();

// In-memory storage for demo (replace with real database)
let appData = {
    customizations: null, // Will be loaded from customization route
    products: [
        {
            id: '1',
            name: 'Black Dashers',
            price: 64,
            stock: 50,
            category: 'eyeglasses',
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
            lastUpdated: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Pink Dashers',
            price: 95,
            stock: 30,
            category: 'eyeglasses',
            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
            lastUpdated: new Date().toISOString()
        }
    ],
    orders: [],
    users: [],
    analytics: {
        totalSales: 0,
        totalOrders: 0,
        activeUsers: 0,
        lastUpdated: new Date().toISOString()
    }
};

// Connected clients tracking
const connectedClients = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);
    
    // Store client info
    connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set()
    });

    // Update active users count
    appData.analytics.activeUsers = connectedClients.size;
    broadcastToAll('analytics:updated', appData.analytics);
    
    // Send current customizations to newly connected client
    if (appData.customizations) {
        socket.emit('customization:current', appData.customizations);
    }

    // Handle client authentication
    socket.on('auth', (data) => {
        const client = connectedClients.get(socket.id);
        if (client) {
            client.userId = data.userId;
            client.userRole = data.role || 'user';
            console.log(`👤 Client authenticated: ${data.userId} (${client.userRole})`);
        }
    });

    // Handle subscription to data channels
    socket.on('subscribe', (channels) => {
        const client = connectedClients.get(socket.id);
        if (client) {
            channels.forEach(channel => {
                client.subscriptions.add(channel);
                socket.join(channel);
            });
            console.log(`📡 Client subscribed to: ${channels.join(', ')}`);
            
            // Send initial data for subscribed channels
            channels.forEach(channel => {
                sendInitialData(socket, channel);
            });
        }
    });

    // Handle unsubscription
    socket.on('unsubscribe', (channels) => {
        const client = connectedClients.get(socket.id);
        if (client) {
            channels.forEach(channel => {
                client.subscriptions.delete(channel);
                socket.leave(channel);
            });
            console.log(`📡 Client unsubscribed from: ${channels.join(', ')}`);
        }
    });

    // Handle real-time data requests
    socket.on('get:products', () => {
        socket.emit('products:data', appData.products);
    });

    socket.on('get:analytics', () => {
        socket.emit('analytics:data', appData.analytics);
    });

    socket.on('get:orders', () => {
        socket.emit('orders:data', appData.orders);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
        const client = connectedClients.get(socket.id);
        if (client) {
            client.lastActivity = new Date();
        }
        socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle app customization
    socket.on('app:customize', (customizations) => {
        console.log('🎨 Customizations received:', customizations);
        
        // Store customizations (in a real app, you'd save to database)
        appData.customizations = customizations;
        
        // Broadcast to all mobile app clients (exclude dashboard)
        socket.broadcast.emit('app:customize', customizations);
        
        console.log('📱 Customizations broadcasted to mobile apps');
    });

    // Handle real-time preview changes
    socket.on('app:preview', (previewData) => {
        console.log('👀 Preview change:', previewData);
        
        // Broadcast preview to all mobile app clients
        socket.broadcast.emit('app:preview', previewData);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        connectedClients.delete(socket.id);
        
        // Update active users count
        appData.analytics.activeUsers = connectedClients.size;
        broadcastToAll('analytics:updated', appData.analytics);
    });
});

// Function to send initial data based on subscription
function sendInitialData(socket, channel) {
    switch (channel) {
        case 'products':
            socket.emit('products:data', appData.products);
            break;
        case 'orders':
            socket.emit('orders:data', appData.orders);
            break;
        case 'analytics':
            socket.emit('analytics:data', appData.analytics);
            break;
        case 'users':
            socket.emit('users:data', appData.users);
            break;
    }
}

// Broadcast functions
function broadcastToAll(event, data) {
    io.emit(event, data);
}

function broadcastToChannel(channel, event, data) {
    io.to(channel).emit(event, data);
}

function broadcastToRole(role, event, data) {
    connectedClients.forEach((client, socketId) => {
        if (client.userRole === role) {
            io.to(socketId).emit(event, data);
        }
    });
}

// REST API Routes with real-time updates

// Get all products
app.get('/api/v1/products', (req, res) => {
    res.json({
        success: true,
        data: { products: appData.products }
    });
});

// Add new product (with real-time broadcast)
app.post('/api/v1/products', (req, res) => {
    const newProduct = {
        id: String(Date.now()),
        ...req.body,
        lastUpdated: new Date().toISOString()
    };
    
    appData.products.push(newProduct);
    
    // Broadcast to all subscribed clients
    broadcastToChannel('products', 'products:added', newProduct);
    broadcastToChannel('products', 'products:data', appData.products);
    
    console.log(`📦 New product added: ${newProduct.name}`);
    
    res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: { product: newProduct }
    });
});

// Update product (with real-time broadcast)
app.put('/api/v1/products/:id', (req, res) => {
    const productId = req.params.id;
    const productIndex = appData.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    const updatedProduct = {
        ...appData.products[productIndex],
        ...req.body,
        lastUpdated: new Date().toISOString()
    };
    
    appData.products[productIndex] = updatedProduct;
    
    // Broadcast to all subscribed clients
    broadcastToChannel('products', 'products:updated', updatedProduct);
    broadcastToChannel('products', 'products:data', appData.products);
    
    console.log(`📝 Product updated: ${updatedProduct.name}`);
    
    res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct }
    });
});

// Delete product (with real-time broadcast)
app.delete('/api/v1/products/:id', (req, res) => {
    const productId = req.params.id;
    const productIndex = appData.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    const deletedProduct = appData.products[productIndex];
    appData.products.splice(productIndex, 1);
    
    // Broadcast to all subscribed clients
    broadcastToChannel('products', 'products:deleted', { id: productId });
    broadcastToChannel('products', 'products:data', appData.products);
    
    console.log(`🗑️ Product deleted: ${deletedProduct.name}`);
    
    res.json({
        success: true,
        message: 'Product deleted successfully',
        data: { product: deletedProduct }
    });
});

// Create order (with real-time broadcast)
app.post('/api/v1/orders', (req, res) => {
    const newOrder = {
        id: `ORD-${Date.now()}`,
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    appData.orders.push(newOrder);
    
    // Update analytics
    appData.analytics.totalOrders += 1;
    appData.analytics.totalSales += newOrder.total || 0;
    appData.analytics.lastUpdated = new Date().toISOString();
    
    // Broadcast to all subscribed clients
    broadcastToChannel('orders', 'orders:added', newOrder);
    broadcastToChannel('orders', 'orders:data', appData.orders);
    broadcastToChannel('analytics', 'analytics:updated', appData.analytics);
    
    console.log(`🛒 New order created: ${newOrder.id}`);
    
    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: newOrder }
    });
});

// Update order status (with real-time broadcast)
app.put('/api/v1/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    const orderIndex = appData.orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }
    
    appData.orders[orderIndex].status = status;
    appData.orders[orderIndex].lastUpdated = new Date().toISOString();
    
    const updatedOrder = appData.orders[orderIndex];
    
    // Broadcast to all subscribed clients
    broadcastToChannel('orders', 'orders:updated', updatedOrder);
    broadcastToChannel('orders', 'orders:data', appData.orders);
    
    console.log(`📋 Order status updated: ${orderId} -> ${status}`);
    
    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order: updatedOrder }
    });
});

// Get analytics
app.get('/api/v1/analytics', (req, res) => {
    res.json({
        success: true,
        data: appData.analytics
    });
});

// Simulate real-time data changes (for demo purposes)
app.post('/api/v1/simulate/price-change', (req, res) => {
    const { productId, newPrice } = req.body;
    
    const productIndex = appData.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        const oldPrice = appData.products[productIndex].price;
        appData.products[productIndex].price = newPrice;
        appData.products[productIndex].lastUpdated = new Date().toISOString();
        
        const updatedProduct = appData.products[productIndex];
        
        // Broadcast price change
        broadcastToChannel('products', 'products:price-changed', {
            product: updatedProduct,
            oldPrice,
            newPrice
        });
        broadcastToChannel('products', 'products:data', appData.products);
        
        console.log(`💰 Price changed: ${updatedProduct.name} ${oldPrice} -> ${newPrice}`);
        
        res.json({
            success: true,
            message: 'Price updated successfully',
            data: { product: updatedProduct }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Real-time Eyejack Backend Server is running',
        timestamp: new Date().toISOString(),
        connectedClients: connectedClients.size,
        version: '2.0.0'
    });
});

// Customization routes
const customizationRoutes = require('./routes/customization');
app.use('/api/v1/customization', customizationRoutes);

// Image upload route
const multer = require('multer');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'collection-' + uniqueSuffix + extension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Image upload endpoint
app.post('/api/v1/upload/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

// Root endpoint
app.get('/backend', (req, res) => {
    res.json({
        message: '🚀 Real-time Eyejack Backend API',
        version: '2.0.0',
        features: ['REST API', 'WebSocket', 'Real-time Updates'],
        connectedClients: connectedClients.size,
        endpoints: {
            health: '/health',
            products: '/api/v1/products',
            orders: '/api/v1/orders',
            analytics: '/api/v1/analytics',
            websocket: 'ws://localhost:3002'
        },
        realTimeEvents: [
            'products:data', 'products:added', 'products:updated', 'products:deleted',
            'orders:data', 'orders:added', 'orders:updated',
            'analytics:updated'
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`
🚀 Real-time Eyejack Backend Started Successfully!
📍 Server running on: http://localhost:${PORT}
🌐 Backend endpoint: http://localhost:${PORT}/backend
🔌 WebSocket endpoint: ws://localhost:${PORT}
🏥 Health check: http://localhost:${PORT}/health
📊 Analytics API: http://localhost:${PORT}/api/v1/analytics
🛒 Products API: http://localhost:${PORT}/api/v1/products
📦 Orders API: http://localhost:${PORT}/api/v1/orders
🌍 Environment: ${process.env.NODE_ENV || 'development'}

🎯 Real-time Features:
   ✅ WebSocket connections
   ✅ Live data synchronization
   ✅ Event-driven updates
   ✅ Multi-client broadcasting
   ✅ Connection management
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Export for testing
module.exports = { app, server, io, globalEvents };
