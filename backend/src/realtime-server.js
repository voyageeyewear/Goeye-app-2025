const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const storiesRoutes = require('./routes/stories');
const usersRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 3002;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/stories', storiesRoutes);
app.use('/api/users', usersRoutes);

// Serve mobile app from public directory
app.get('/mobile-app.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/mobile-app.html'));
});

// Serve admin dashboard
app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory for persistence
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Data persistence file
const dataFile = path.join(dataDir, 'customizations.json');

// Data persistence functions
function saveData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        console.log('💾 Data saved successfully');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, 'utf8');
            console.log('📂 Data loaded successfully');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
    
    // Return default data if file doesn't exist or error occurred
    console.log('🔧 Using default data structure');
    return {
        header: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            logoUrl: ''
        },
        theme: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            accentColor: '#28a745',
            backgroundColor: '#ffffff'
        },
        highlights: {
            items: []
        },
        collections: {
            items: []
        },
        lastUpdated: new Date().toISOString()
    };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Load data from persistent storage
let appCustomizations = loadData();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);

    socket.on('authenticate', (data) => {
        console.log(`👤 Client authenticated: ${data.userId} (${data.userType})`);
        socket.userId = data.userId;
        socket.userType = data.userType;
        socket.emit('authenticated', { userType: data.userType });
    });

    socket.on('customization:update', (data) => {
        console.log('🔄 Customization update received:', data);
        
        if (data.section && appCustomizations[data.section]) {
            appCustomizations[data.section] = { ...appCustomizations[data.section], ...data.data };
            appCustomizations.lastUpdated = new Date().toISOString();
            
            // Save to persistent storage
            saveData(appCustomizations);
            
            // Broadcast to all clients
            io.emit('customization:updated', { 
                section: data.section, 
                data: appCustomizations[data.section] 
            });
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: PORT 
    });
});

// Get all customizations
app.get('/api/customization', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations
    });
});

// Highlights API
app.get('/api/customization/highlights', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations.highlights
    });
});

app.post('/api/customization/highlights/items', (req, res) => {
    const { label, imageUrl, videoUrl, mediaType } = req.body;

    if (!label) {
        return res.status(400).json({
            success: false,
            message: 'Label is required'
        });
    }

    const newItem = {
        id: `highlight_${Date.now()}`,
        label: label,
        imageUrl: imageUrl || '',
        videoUrl: videoUrl || '',
        mediaType: mediaType || 'image',
        order: appCustomizations.highlights.items.length + 1
    };

    appCustomizations.highlights.items.push(newItem);
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'highlights', 
        data: appCustomizations.highlights 
    });

    res.status(201).json({ 
        success: true, 
        message: 'Highlight item added', 
        item: newItem 
    });
});

app.put('/api/customization/highlights/items/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Highlight item not found'
        });
    }

    appCustomizations.highlights.items[itemIndex] = {
        ...appCustomizations.highlights.items[itemIndex],
        ...updates
    };
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'highlights', 
        data: appCustomizations.highlights 
    });

    res.json({ 
        success: true, 
        message: 'Highlight item updated',
        item: appCustomizations.highlights.items[itemIndex]
    });
});

app.delete('/api/customization/highlights/items/:id', (req, res) => {
    const { id } = req.params;

    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Highlight item not found'
        });
    }

    appCustomizations.highlights.items.splice(itemIndex, 1);
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'highlights', 
        data: appCustomizations.highlights 
    });

    res.json({ 
        success: true, 
        message: 'Highlight item deleted' 
    });
});

// Collections API
app.get('/api/customization/collections', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations.collections
    });
});

app.post('/api/customization/collections/items', (req, res) => {
    const { title, imageUrl, clickUrl } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: 'Title is required'
        });
    }

    const newItem = {
        id: `collection_${Date.now()}`,
        title: title,
        imageUrl: imageUrl || '',
        clickUrl: clickUrl || '',
        order: appCustomizations.collections.items.length + 1
    };

    appCustomizations.collections.items.push(newItem);
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'collections', 
        data: appCustomizations.collections 
    });

    res.status(201).json({ 
        success: true, 
        message: 'Collection item added', 
        item: newItem 
    });
});

app.put('/api/customization/collections/items/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const itemIndex = appCustomizations.collections.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }

    appCustomizations.collections.items[itemIndex] = {
        ...appCustomizations.collections.items[itemIndex],
        ...updates
    };
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'collections', 
        data: appCustomizations.collections 
    });

    res.json({ 
        success: true, 
        message: 'Collection item updated',
        item: appCustomizations.collections.items[itemIndex]
    });
});

app.delete('/api/customization/collections/items/:id', (req, res) => {
    const { id } = req.params;

    const itemIndex = appCustomizations.collections.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }

    appCustomizations.collections.items.splice(itemIndex, 1);
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'collections', 
        data: appCustomizations.collections 
    });

    res.json({ 
        success: true, 
        message: 'Collection item deleted' 
    });
});

// File upload endpoints
app.post('/api/customization/highlights/items/:id/upload', upload.single('media'), (req, res) => {
    const { id } = req.params;
    const { mediaType } = req.body;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Highlight item not found'
        });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    if (mediaType === 'video') {
        appCustomizations.highlights.items[itemIndex].videoUrl = fileUrl;
        appCustomizations.highlights.items[itemIndex].imageUrl = '';
    } else {
        appCustomizations.highlights.items[itemIndex].imageUrl = fileUrl;
        appCustomizations.highlights.items[itemIndex].videoUrl = '';
    }
    
    appCustomizations.highlights.items[itemIndex].mediaType = mediaType;
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'highlights', 
        data: appCustomizations.highlights 
    });

    res.json({ 
        success: true, 
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        item: appCustomizations.highlights.items[itemIndex]
    });
});

// Story management endpoints
app.post('/api/customization/highlights/items/:id/stories', (req, res) => {
    const { id } = req.params;
    const storyData = req.body;
    
    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Highlight not found' });
    }

    // Initialize stories array if it doesn't exist
    if (!appCustomizations.highlights.items[itemIndex].stories) {
        appCustomizations.highlights.items[itemIndex].stories = [];
    }

    const newStory = {
        id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: storyData.title,
        mediaType: storyData.mediaType,
        mediaUrl: storyData.mediaUrl,
        createdAt: storyData.createdAt || new Date().toISOString()
    };

    appCustomizations.highlights.items[itemIndex].stories.push(newStory);
    appCustomizations.lastUpdated = new Date().toISOString();
    
    saveData(appCustomizations);
    
    // Broadcast update to all connected clients
    io.emit('customization:updated', {
        section: 'highlights',
        data: appCustomizations.highlights
    });

    res.json({
        success: true,
        message: 'Story added successfully',
        story: newStory
    });
});

app.put('/api/customization/highlights/items/:id/stories/:storyIndex', (req, res) => {
    const { id, storyIndex } = req.params;
    const storyData = req.body;
    
    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Highlight not found' });
    }

    if (!appCustomizations.highlights.items[itemIndex].stories) {
        return res.status(404).json({ success: false, message: 'No stories found' });
    }

    const storyIdx = parseInt(storyIndex);
    if (storyIdx < 0 || storyIdx >= appCustomizations.highlights.items[itemIndex].stories.length) {
        return res.status(404).json({ success: false, message: 'Story not found' });
    }

    appCustomizations.highlights.items[itemIndex].stories[storyIdx] = {
        ...appCustomizations.highlights.items[itemIndex].stories[storyIdx],
        title: storyData.title,
        mediaType: storyData.mediaType,
        mediaUrl: storyData.mediaUrl,
        updatedAt: storyData.updatedAt || new Date().toISOString()
    };

    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update to all connected clients
    io.emit('customization:updated', {
        section: 'highlights',
        data: appCustomizations.highlights
    });

    res.json({
        success: true,
        message: 'Story updated successfully',
        story: appCustomizations.highlights.items[itemIndex].stories[storyIdx]
    });
});

app.delete('/api/customization/highlights/items/:id/stories/:storyIndex', (req, res) => {
    const { id, storyIndex } = req.params;
    
    const itemIndex = appCustomizations.highlights.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Highlight not found' });
    }

    if (!appCustomizations.highlights.items[itemIndex].stories) {
        return res.status(404).json({ success: false, message: 'No stories found' });
    }

    const storyIdx = parseInt(storyIndex);
    if (storyIdx < 0 || storyIdx >= appCustomizations.highlights.items[itemIndex].stories.length) {
        return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const deletedStory = appCustomizations.highlights.items[itemIndex].stories.splice(storyIdx, 1)[0];
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update to all connected clients
    io.emit('customization:updated', {
        section: 'highlights',
        data: appCustomizations.highlights
    });

    res.json({
        success: true,
        message: 'Story deleted successfully',
        story: deletedStory
    });
});

app.post('/api/customization/collections/items/:id/upload', upload.single('image'), (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const itemIndex = appCustomizations.collections.items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    appCustomizations.collections.items[itemIndex].imageUrl = fileUrl;
    appCustomizations.lastUpdated = new Date().toISOString();

    // Save to persistent storage
    saveData(appCustomizations);

    // Broadcast changes
    io.emit('customization:updated', { 
        section: 'collections', 
        data: appCustomizations.collections 
    });

    res.json({ 
        success: true, 
        message: 'Image uploaded successfully',
        fileUrl: fileUrl,
        item: appCustomizations.collections.items[itemIndex]
    });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log('🚀 Real-time Eyejack Backend Started Successfully!');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Backend endpoint: http://localhost:${PORT}/backend`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Analytics API: http://localhost:${PORT}/api/v1/analytics`);
    console.log(`🛒 Products API: http://localhost:${PORT}/api/v1/products`);
    console.log(`📦 Orders API: http://localhost:${PORT}/api/v1/orders`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🎯 Real-time Features:');
    console.log('   ✅ WebSocket connections');
    console.log('   ✅ Live data synchronization');
    console.log('   ✅ Event-driven updates');
    console.log('   ✅ Multi-client broadcasting');
    console.log('   ✅ Connection management');
    console.log('   ');
});

module.exports = { app, server, io };
