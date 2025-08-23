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
        fileSize: 100 * 1024 * 1024 // 100MB limit for video uploads
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

// Announcement API
app.get('/api/customization/announcement', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations.announcement || {}
    });
});

app.post('/api/customization/announcement', (req, res) => {
    const { enabled, text, backgroundColor, textColor } = req.body;

    if (!appCustomizations.announcement) {
        appCustomizations.announcement = {
            enabled: true,
            text: "🎉 Welcome to our store! Free shipping on orders over ₹50!",
            backgroundColor: "#2563eb",
            textColor: "#ffffff"
        };
    }

    if (enabled !== undefined) appCustomizations.announcement.enabled = enabled;
    if (text !== undefined) appCustomizations.announcement.text = text;
    if (backgroundColor !== undefined) appCustomizations.announcement.backgroundColor = backgroundColor;
    if (textColor !== undefined) appCustomizations.announcement.textColor = textColor;

    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);

    // Broadcast update
    io.emit('customization:updated', {
        section: 'announcement',
        data: appCustomizations.announcement
    });

    res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: appCustomizations.announcement
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

// Glasses API Endpoints
app.get('/api/customization/glasses', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations.glasses || {}
    });
});

app.get('/api/customization/glasses/:type', (req, res) => {
    const { type } = req.params;
    const glassesType = appCustomizations.glasses?.[type];
    
    if (!glassesType) {
        return res.status(404).json({
            success: false,
            message: 'Glasses type not found'
        });
    }
    
    res.json({
        success: true,
        data: glassesType
    });
});

app.post('/api/customization/glasses/:type', (req, res) => {
    const { type } = req.params;
    const { title, enabled, categories } = req.body;
    
    if (!appCustomizations.glasses) {
        appCustomizations.glasses = {};
    }
    
    // Preserve existing categories if not provided
    const existingCategories = appCustomizations.glasses[type]?.categories || [];
    
    appCustomizations.glasses[type] = {
        title: title || appCustomizations.glasses[type]?.title || 'Glasses',
        enabled: enabled !== undefined ? enabled : (appCustomizations.glasses[type]?.enabled !== false),
        categories: categories || existingCategories
    };
    
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update
    io.emit('customization:updated', {
        section: 'glasses',
        data: appCustomizations.glasses
    });
    
    res.json({
        success: true,
        message: `${type} glasses updated successfully`,
        data: appCustomizations.glasses[type]
    });
});

app.post('/api/customization/glasses/:type/categories', (req, res) => {
    const { type } = req.params;
    const { name, imageUrl, order } = req.body;
    
    if (!appCustomizations.glasses?.[type]) {
        return res.status(404).json({
            success: false,
            message: 'Glasses type not found'
        });
    }
    
    const newCategory = {
        id: `${type}_${Date.now()}`,
        name: name || 'Category',
        imageUrl: imageUrl || '',
        order: order || 1
    };
    
    appCustomizations.glasses[type].categories.push(newCategory);
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update
    io.emit('customization:updated', {
        section: 'glasses',
        data: appCustomizations.glasses
    });
    
    res.json({
        success: true,
        message: 'Category added successfully',
        data: newCategory
    });
});

app.put('/api/customization/glasses/:type/categories/:id', (req, res) => {
    const { type, id } = req.params;
    const { name, imageUrl, order } = req.body;
    
    if (!appCustomizations.glasses?.[type]) {
        return res.status(404).json({
            success: false,
            message: 'Glasses type not found'
        });
    }
    
    const categoryIndex = appCustomizations.glasses[type].categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }
    
    if (name !== undefined) appCustomizations.glasses[type].categories[categoryIndex].name = name;
    if (imageUrl !== undefined) appCustomizations.glasses[type].categories[categoryIndex].imageUrl = imageUrl;
    if (order !== undefined) appCustomizations.glasses[type].categories[categoryIndex].order = order;
    
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update
    io.emit('customization:updated', {
        section: 'glasses',
        data: appCustomizations.glasses
    });
    
    res.json({
        success: true,
        message: 'Category updated successfully',
        data: appCustomizations.glasses[type].categories[categoryIndex]
    });
});

app.delete('/api/customization/glasses/:type/categories/:id', (req, res) => {
    const { type, id } = req.params;
    
    if (!appCustomizations.glasses?.[type]) {
        return res.status(404).json({
            success: false,
            message: 'Glasses type not found'
        });
    }
    
    const categoryIndex = appCustomizations.glasses[type].categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }
    
    const deletedCategory = appCustomizations.glasses[type].categories.splice(categoryIndex, 1)[0];
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update
    io.emit('customization:updated', {
        section: 'glasses',
        data: appCustomizations.glasses
    });
    
    res.json({
        success: true,
        message: 'Category deleted successfully',
        data: deletedCategory
    });
});

app.post('/api/customization/glasses/:type/categories/:id/upload', upload.single('image'), (req, res) => {
    const { type, id } = req.params;
    
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }
    
    if (!appCustomizations.glasses?.[type]) {
        return res.status(404).json({
            success: false,
            message: 'Glasses type not found'
        });
    }
    
    const categoryIndex = appCustomizations.glasses[type].categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    appCustomizations.glasses[type].categories[categoryIndex].imageUrl = fileUrl;
    appCustomizations.lastUpdated = new Date().toISOString();
    saveData(appCustomizations);
    
    // Broadcast update
    io.emit('customization:updated', {
        section: 'glasses',
        data: appCustomizations.glasses
    });
    
    res.json({
        success: true,
        message: 'Image uploaded successfully',
        fileUrl: fileUrl,
        data: appCustomizations.glasses[type].categories[categoryIndex]
    });
        });
        
        // Featured Products API Endpoints
        app.get('/api/customization/featured-products', (req, res) => {
            res.json({
                success: true,
                data: appCustomizations.featuredProducts || {}
            });
        });
        
        app.post('/api/customization/featured-products', (req, res) => {
            const { title, subtitle, enabled } = req.body;
            
            if (!appCustomizations.featuredProducts) {
                appCustomizations.featuredProducts = {
                    title: 'Featured Products',
                    subtitle: 'Discover our products through video',
                    enabled: true,
                    products: []
                };
            }
            
            if (title !== undefined) appCustomizations.featuredProducts.title = title;
            if (subtitle !== undefined) appCustomizations.featuredProducts.subtitle = subtitle;
            if (enabled !== undefined) appCustomizations.featuredProducts.enabled = enabled;
            
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'featuredProducts',
                data: appCustomizations.featuredProducts
            });
            
            res.json({
                success: true,
                message: 'Featured products settings updated successfully',
                data: appCustomizations.featuredProducts
            });
        });
        
        app.post('/api/customization/featured-products/products', (req, res) => {
            const { name, videoUrl, order } = req.body;
            
            if (!appCustomizations.featuredProducts) {
                appCustomizations.featuredProducts = {
                    title: 'Featured Products',
                    subtitle: 'Discover our products through video',
                    enabled: true,
                    products: []
                };
            }
            
            const newProduct = {
                id: `featured_${Date.now()}`,
                name: name || 'Product',
                videoUrl: videoUrl || '',
                order: order || 1
            };
            
            appCustomizations.featuredProducts.products.push(newProduct);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'featuredProducts',
                data: appCustomizations.featuredProducts
            });
            
            res.json({
                success: true,
                message: 'Product added successfully',
                data: newProduct
            });
        });
        
        app.put('/api/customization/featured-products/products/:id', (req, res) => {
            const { id } = req.params;
            const { name, videoUrl, order } = req.body;
            
            if (!appCustomizations.featuredProducts?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Featured products not found'
                });
            }
            
            const productIndex = appCustomizations.featuredProducts.products.findIndex(product => product.id === id);
            
            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            if (name !== undefined) appCustomizations.featuredProducts.products[productIndex].name = name;
            if (videoUrl !== undefined) appCustomizations.featuredProducts.products[productIndex].videoUrl = videoUrl;
            if (order !== undefined) appCustomizations.featuredProducts.products[productIndex].order = order;
            
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'featuredProducts',
                data: appCustomizations.featuredProducts
            });
            
            res.json({
                success: true,
                message: 'Product updated successfully',
                data: appCustomizations.featuredProducts.products[productIndex]
            });
        });
        
        app.delete('/api/customization/featured-products/products/:id', (req, res) => {
            const { id } = req.params;
            
            if (!appCustomizations.featuredProducts?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Featured products not found'
                });
            }
            
            const productIndex = appCustomizations.featuredProducts.products.findIndex(product => product.id === id);
            
            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            const deletedProduct = appCustomizations.featuredProducts.products.splice(productIndex, 1)[0];
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'featuredProducts',
                data: appCustomizations.featuredProducts
            });
            
            res.json({
                success: true,
                message: 'Product deleted successfully',
                data: deletedProduct
            });
        });
        
        app.post('/api/customization/featured-products/products/:id/upload', upload.single('video'), (req, res) => {
            const { id } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            if (!appCustomizations.featuredProducts?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Featured products not found'
                });
            }
            
            const productIndex = appCustomizations.featuredProducts.products.findIndex(product => product.id === id);
            
            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            const fileUrl = `/uploads/${req.file.filename}`;
            appCustomizations.featuredProducts.products[productIndex].videoUrl = fileUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'featuredProducts',
                data: appCustomizations.featuredProducts
            });
            
            res.json({
                success: true,
                message: 'Video uploaded successfully',
                fileUrl: fileUrl,
                data: appCustomizations.featuredProducts.products[productIndex]
            });
        });

        // New Arrivals API Endpoints
        app.get('/api/customization/new-arrivals', (req, res) => {
            res.json({
                success: true,
                data: appCustomizations.newArrivals || {}
            });
        });

        app.post('/api/customization/new-arrivals', (req, res) => {
            const { title, subtitle, enabled } = req.body;

            if (!appCustomizations.newArrivals) {
                appCustomizations.newArrivals = {
                    title: "New Arrivals",
                    subtitle: "Discover our latest products through video",
                    enabled: true,
                    products: []
                };
            }

            if (title !== undefined) appCustomizations.newArrivals.title = title;
            if (subtitle !== undefined) appCustomizations.newArrivals.subtitle = subtitle;
            if (enabled !== undefined) appCustomizations.newArrivals.enabled = enabled;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'newArrivals',
                data: appCustomizations.newArrivals
            });

            res.json({
                success: true,
                message: 'New arrivals settings updated successfully',
                data: appCustomizations.newArrivals
            });
        });

        app.post('/api/customization/new-arrivals/products', (req, res) => {
            const { name, videoUrl } = req.body;

            if (!appCustomizations.newArrivals) {
                appCustomizations.newArrivals = {
                    title: "New Arrivals",
                    subtitle: "Discover our latest products through video",
                    enabled: true,
                    products: []
                };
            }

            if (!appCustomizations.newArrivals.products) {
                appCustomizations.newArrivals.products = [];
            }

            const newProduct = {
                id: `new_arrival_${Date.now()}`,
                name: name || 'New Product',
                videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                order: appCustomizations.newArrivals.products.length + 1
            };

            appCustomizations.newArrivals.products.push(newProduct);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'newArrivals',
                data: appCustomizations.newArrivals
            });

            res.json({
                success: true,
                message: 'New arrival product added successfully',
                data: newProduct
            });
        });

        app.put('/api/customization/new-arrivals/products/:id', (req, res) => {
            const { id } = req.params;
            const { name, order } = req.body;

            if (!appCustomizations.newArrivals?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'New arrivals products not found'
                });
            }

            const productIndex = appCustomizations.newArrivals.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (name !== undefined) appCustomizations.newArrivals.products[productIndex].name = name;
            if (order !== undefined) appCustomizations.newArrivals.products[productIndex].order = order;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'newArrivals',
                data: appCustomizations.newArrivals
            });

            res.json({
                success: true,
                message: 'New arrival product updated successfully',
                data: appCustomizations.newArrivals.products[productIndex]
            });
        });

        app.delete('/api/customization/new-arrivals/products/:id', (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.newArrivals?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'New arrivals products not found'
                });
            }

            const productIndex = appCustomizations.newArrivals.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            appCustomizations.newArrivals.products.splice(productIndex, 1);

            // Reorder remaining products
            appCustomizations.newArrivals.products.forEach((product, index) => {
                product.order = index + 1;
            });

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'newArrivals',
                data: appCustomizations.newArrivals
            });

            res.json({
                success: true,
                message: 'New arrival product deleted successfully'
            });
        });

        app.post('/api/customization/new-arrivals/products/:id/upload', upload.single('video'), (req, res) => {
            const { id } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            if (!appCustomizations.newArrivals?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'New arrivals products not found'
                });
            }
            
            const productIndex = appCustomizations.newArrivals.products.findIndex(product => product.id === id);
            
            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            const fileUrl = `/uploads/${req.file.filename}`;
            appCustomizations.newArrivals.products[productIndex].videoUrl = fileUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'newArrivals',
                data: appCustomizations.newArrivals
            });
            
            res.json({
                success: true,
                message: 'Video uploaded successfully',
                fileUrl: fileUrl,
                data: appCustomizations.newArrivals.products[productIndex]
            });
        });

        // Exclusive Section API Endpoints
        app.get('/api/customization/exclusive', (req, res) => {
            res.json({
                success: true,
                data: appCustomizations.exclusive || {}
            });
        });

        app.post('/api/customization/exclusive', (req, res) => {
            const { title, subtitle, enabled, borderColor } = req.body;

            if (!appCustomizations.exclusive) {
                appCustomizations.exclusive = {
                    title: "Exclusively at GOEYE",
                    subtitle: "Get the perfect vision and style",
                    enabled: true,
                    borderColor: "#fd7f6f",
                    products: []
                };
            }

            if (title !== undefined) appCustomizations.exclusive.title = title;
            if (subtitle !== undefined) appCustomizations.exclusive.subtitle = subtitle;
            if (enabled !== undefined) appCustomizations.exclusive.enabled = enabled;
            if (borderColor !== undefined) appCustomizations.exclusive.borderColor = borderColor;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });

            res.json({
                success: true,
                message: 'Exclusive section settings updated successfully',
                data: appCustomizations.exclusive
            });
        });

        app.post('/api/customization/exclusive/products', (req, res) => {
            const { videoUrl } = req.body;

            if (!appCustomizations.exclusive) {
                appCustomizations.exclusive = {
                    title: "Exclusively at GOEYE",
                    subtitle: "Get the perfect vision and style",
                    enabled: true,
                    borderColor: "#fd7f6f",
                    products: []
                };
            }

            if (!appCustomizations.exclusive.products) {
                appCustomizations.exclusive.products = [];
            }

            const newProduct = {
                id: `exclusive_${Date.now()}`,
                videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                order: appCustomizations.exclusive.products.length + 1
            };

            appCustomizations.exclusive.products.push(newProduct);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });

            res.json({
                success: true,
                message: 'Exclusive product added successfully',
                data: newProduct
            });
        });

        app.put('/api/customization/exclusive/products/:id', (req, res) => {
            const { id } = req.params;
            const { order } = req.body;

            if (!appCustomizations.exclusive?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Exclusive products not found'
                });
            }

            const productIndex = appCustomizations.exclusive.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (order !== undefined) appCustomizations.exclusive.products[productIndex].order = order;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });

            res.json({
                success: true,
                message: 'Exclusive product updated successfully',
                data: appCustomizations.exclusive.products[productIndex]
            });
        });

        app.delete('/api/customization/exclusive/products/:id', (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.exclusive?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Exclusive products not found'
                });
            }

            const productIndex = appCustomizations.exclusive.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            appCustomizations.exclusive.products.splice(productIndex, 1);

            // Reorder remaining products
            appCustomizations.exclusive.products.forEach((product, index) => {
                product.order = index + 1;
            });

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });

            res.json({
                success: true,
                message: 'Exclusive product deleted successfully'
            });
        });

        app.post('/api/customization/exclusive/products/:id/upload', upload.single('video'), (req, res) => {
            const { id } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            if (!appCustomizations.exclusive?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Exclusive products not found'
                });
            }
            
            const productIndex = appCustomizations.exclusive.products.findIndex(product => product.id === id);
            
            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            const fileUrl = `/uploads/${req.file.filename}`;
            appCustomizations.exclusive.products[productIndex].videoUrl = fileUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);
            
            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });
            
            res.json({
                success: true,
                message: 'Video uploaded successfully',
                fileUrl: fileUrl,
                data: appCustomizations.exclusive.products[productIndex]
            });
        });

        // Update exclusive product video URL
        app.put('/api/customization/exclusive/products/:id/video-url', (req, res) => {
            const { id } = req.params;
            const { videoUrl } = req.body;

            if (!videoUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Video URL is required'
                });
            }

            if (!appCustomizations.exclusive?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Exclusive products not found'
                });
            }

            const productIndex = appCustomizations.exclusive.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Update the video URL
            appCustomizations.exclusive.products[productIndex].videoUrl = videoUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'exclusive',
                data: appCustomizations.exclusive
            });

            res.json({
                success: true,
                message: 'Video URL updated successfully',
                data: appCustomizations.exclusive.products[productIndex]
            });
        });

        // Mood Look API Endpoints
        app.get('/api/customization/mood-look', (req, res) => {
            res.json({
                success: true,
                data: appCustomizations.moodLook || {}
            });
        });

        app.post('/api/customization/mood-look', (req, res) => {
            const { title, highlight, subtitle, enabled } = req.body;

            if (!appCustomizations.moodLook) {
                appCustomizations.moodLook = {
                    title: "Today's mood",
                    highlight: "Look",
                    subtitle: "Discover every look, for every style",
                    enabled: true,
                    categories: []
                };
            }

            if (title !== undefined) appCustomizations.moodLook.title = title;
            if (highlight !== undefined) appCustomizations.moodLook.highlight = highlight;
            if (subtitle !== undefined) appCustomizations.moodLook.subtitle = subtitle;
            if (enabled !== undefined) appCustomizations.moodLook.enabled = enabled;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Mood look settings updated successfully',
                data: appCustomizations.moodLook
            });
        });

        app.post('/api/customization/mood-look/categories', (req, res) => {
            const { title, subtitle } = req.body;

            if (!appCustomizations.moodLook) {
                appCustomizations.moodLook = {
                    title: "Today's mood",
                    highlight: "Look",
                    subtitle: "Discover every look, for every style",
                    enabled: true,
                    categories: []
                };
            }

            const newCategory = {
                id: `mood_${Date.now()}`,
                title: title || 'Category',
                subtitle: subtitle || 'Explore All',
                looks: []
            };

            appCustomizations.moodLook.categories.push(newCategory);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Category added successfully',
                data: newCategory
            });
        });

        app.get('/api/customization/mood-look/categories/:id', (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const category = appCustomizations.moodLook.categories.find(category => category.id === id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                data: category
            });
        });

        app.put('/api/customization/mood-look/categories/:id', (req, res) => {
            const { id } = req.params;
            const { title, subtitle } = req.body;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === id);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            if (title !== undefined) appCustomizations.moodLook.categories[categoryIndex].title = title;
            if (subtitle !== undefined) appCustomizations.moodLook.categories[categoryIndex].subtitle = subtitle;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Category updated successfully',
                data: appCustomizations.moodLook.categories[categoryIndex]
            });
        });

        app.delete('/api/customization/mood-look/categories/:id', (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === id);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const deletedCategory = appCustomizations.moodLook.categories.splice(categoryIndex, 1)[0];
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Category deleted successfully',
                data: deletedCategory
            });
        });

        app.post('/api/customization/mood-look/categories/:categoryId/looks', upload.single('image'), (req, res) => {
            const { categoryId } = req.params;
            const { name, imageUrl } = req.body;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            let finalImageUrl = 'https://via.placeholder.com/200x200?text=Look';
            
            // Handle image upload
            if (req.file) {
                const timestamp = Date.now();
                const randomId = Math.floor(Math.random() * 1000000000);
                const fileExtension = path.extname(req.file.originalname);
                const fileName = `mood-look-${timestamp}-${randomId}${fileExtension}`;
                const filePath = path.join(uploadsDir, fileName);
                
                // Move uploaded file to uploads directory
                fs.renameSync(req.file.path, filePath);
                
                finalImageUrl = `/uploads/${fileName}`;
            } else if (imageUrl) {
                // Use provided image URL
                finalImageUrl = imageUrl;
            }

            const newLook = {
                id: `look_${Date.now()}`,
                name: name || 'Look',
                imageUrl: finalImageUrl,
                order: appCustomizations.moodLook.categories[categoryIndex].looks.length + 1
            };

            appCustomizations.moodLook.categories[categoryIndex].looks.push(newLook);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Look added successfully',
                data: newLook
            });
        });

        app.put('/api/customization/mood-look/categories/:categoryId/looks/:lookId', (req, res) => {
            const { categoryId, lookId } = req.params;
            const { name, order } = req.body;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const lookIndex = appCustomizations.moodLook.categories[categoryIndex].looks.findIndex(look => look.id === lookId);

            if (lookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Look not found'
                });
            }

            if (name !== undefined) appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex].name = name;
            if (order !== undefined) appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex].order = order;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Look updated successfully',
                data: appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex]
            });
        });

        app.post('/api/customization/mood-look/categories/:categoryId/looks/:lookId/duplicate', (req, res) => {
            const { categoryId, lookId } = req.params;
            const { name } = req.body;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const lookIndex = appCustomizations.moodLook.categories[categoryIndex].looks.findIndex(look => look.id === lookId);

            if (lookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Look not found'
                });
            }

            const originalLook = appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex];
            
            const duplicatedLook = {
                id: `look_${Date.now()}`,
                name: name || `${originalLook.name} (Copy)`,
                imageUrl: originalLook.imageUrl, // Copy the same image
                order: appCustomizations.moodLook.categories[categoryIndex].looks.length + 1
            };

            appCustomizations.moodLook.categories[categoryIndex].looks.push(duplicatedLook);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Look duplicated successfully',
                data: duplicatedLook
            });
        });

        app.delete('/api/customization/mood-look/categories/:categoryId/looks/:lookId', (req, res) => {
            const { categoryId, lookId } = req.params;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const lookIndex = appCustomizations.moodLook.categories[categoryIndex].looks.findIndex(look => look.id === lookId);

            if (lookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Look not found'
                });
            }

            const deletedLook = appCustomizations.moodLook.categories[categoryIndex].looks.splice(lookIndex, 1)[0];
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Look deleted successfully',
                data: deletedLook
            });
        });

        // Most Loved Section API Endpoints
        app.get('/api/customization/most-loved', (req, res) => {
            if (!appCustomizations.mostLoved) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            res.json({
                success: true,
                data: appCustomizations.mostLoved
            });
        });

        app.post('/api/customization/most-loved', (req, res) => {
            const { title, subtitle, enabled, showCarouselDots, autoplay, autoplayInterval } = req.body;

            if (!appCustomizations.mostLoved) {
                appCustomizations.mostLoved = {
                    enabled: true,
                    title: { text: "Most Loved", fontSize: "1.8rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontColor: "#2d3748" },
                    subtitle: { text: "Customers favourite listed every 15 days", fontSize: "1rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontColor: "#718096" },
                    showCarouselDots: true,
                    autoplay: true,
                    autoplayInterval: 3000,
                    products: []
                };
            }

            if (title !== undefined) appCustomizations.mostLoved.title = title;
            if (subtitle !== undefined) appCustomizations.mostLoved.subtitle = subtitle;
            if (enabled !== undefined) appCustomizations.mostLoved.enabled = enabled;
            if (showCarouselDots !== undefined) appCustomizations.mostLoved.showCarouselDots = showCarouselDots;
            if (autoplay !== undefined) appCustomizations.mostLoved.autoplay = autoplay;
            if (autoplayInterval !== undefined) appCustomizations.mostLoved.autoplayInterval = autoplayInterval;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Most loved settings updated successfully',
                data: appCustomizations.mostLoved
            });
        });

        app.post('/api/customization/most-loved/products', (req, res) => {
            const { name, description, imageUrl } = req.body;

            if (!appCustomizations.mostLoved) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            if (!appCustomizations.mostLoved.products) {
                appCustomizations.mostLoved.products = [];
            }

            const newProduct = {
                id: `most_loved_${Date.now()}`,
                name: name || 'Product',
                description: description || 'Product description',
                imageUrl: imageUrl || 'https://via.placeholder.com/600x800?text=Product',
                order: appCustomizations.mostLoved.products.length + 1
            };

            appCustomizations.mostLoved.products.push(newProduct);
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Product added successfully',
                data: newProduct
            });
        });

        app.put('/api/customization/most-loved/products/:id', (req, res) => {
            const { id } = req.params;
            const { name, description, order } = req.body;

            if (!appCustomizations.mostLoved?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            const productIndex = appCustomizations.mostLoved.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (name !== undefined) appCustomizations.mostLoved.products[productIndex].name = name;
            if (description !== undefined) appCustomizations.mostLoved.products[productIndex].description = description;
            if (order !== undefined) appCustomizations.mostLoved.products[productIndex].order = order;

            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: appCustomizations.mostLoved.products[productIndex]
            });
        });

        app.delete('/api/customization/most-loved/products/:id', (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.mostLoved?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            const productIndex = appCustomizations.mostLoved.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const deletedProduct = appCustomizations.mostLoved.products.splice(productIndex, 1)[0];
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Product deleted successfully',
                data: deletedProduct
            });
        });

        app.post('/api/customization/most-loved/products/:id/upload', upload.single('image'), (req, res) => {
            const { id } = req.params;

            if (!appCustomizations.mostLoved?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            const productIndex = appCustomizations.mostLoved.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            const timestamp = Date.now();
            const randomId = Math.floor(Math.random() * 1000000000);
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `most-loved-${timestamp}-${randomId}${fileExtension}`;
            const filePath = path.join(uploadsDir, fileName);

            // Move uploaded file to uploads directory
            fs.renameSync(req.file.path, filePath);

            appCustomizations.mostLoved.products[productIndex].imageUrl = `/uploads/${fileName}`;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Product image updated successfully',
                data: appCustomizations.mostLoved.products[productIndex]
            });
        });

        app.put('/api/customization/most-loved/products/:id/update-url', (req, res) => {
            const { id } = req.params;
            const { imageUrl } = req.body;

            if (!appCustomizations.mostLoved?.products) {
                return res.status(404).json({
                    success: false,
                    message: 'Most loved section not found'
                });
            }

            const productIndex = appCustomizations.mostLoved.products.findIndex(product => product.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            appCustomizations.mostLoved.products[productIndex].imageUrl = imageUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'mostLoved',
                data: appCustomizations.mostLoved
            });

            res.json({
                success: true,
                message: 'Product image URL updated successfully',
                data: appCustomizations.mostLoved.products[productIndex]
            });
        });

        app.put('/api/customization/mood-look/categories/:categoryId/looks/:lookId/update-url', (req, res) => {
            const { categoryId, lookId } = req.params;
            const { imageUrl } = req.body;

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const lookIndex = appCustomizations.moodLook.categories[categoryIndex].looks.findIndex(look => look.id === lookId);

            if (lookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Look not found'
                });
            }

            appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex].imageUrl = imageUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Image URL updated successfully',
                data: appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex]
            });
        });

        app.post('/api/customization/mood-look/categories/:categoryId/looks/:lookId/upload', upload.single('image'), (req, res) => {
            const { categoryId, lookId } = req.params;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            if (!appCustomizations.moodLook?.categories) {
                return res.status(404).json({
                    success: false,
                    message: 'Mood look not found'
                });
            }

            const categoryIndex = appCustomizations.moodLook.categories.findIndex(category => category.id === categoryId);

            if (categoryIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const lookIndex = appCustomizations.moodLook.categories[categoryIndex].looks.findIndex(look => look.id === lookId);

            if (lookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Look not found'
                });
            }

            const fileUrl = `/uploads/${req.file.filename}`;
            appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex].imageUrl = fileUrl;
            appCustomizations.lastUpdated = new Date().toISOString();
            saveData(appCustomizations);

            // Broadcast update
            io.emit('customization:updated', {
                section: 'moodLook',
                data: appCustomizations.moodLook
            });

            res.json({
                success: true,
                message: 'Image uploaded successfully',
                fileUrl: fileUrl,
                data: appCustomizations.moodLook.categories[categoryIndex].looks[lookIndex]
            });
        });
        
        // Serve uploaded files
        app.use('/uploads', express.static(uploadsDir));

// Multer error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 100MB.'
            });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded.'
            });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    }
    
    next(err);
});

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
