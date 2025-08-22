const express = require('express');
const router = express.Router();

// Store customization settings (in production, this would be in a database)
let appCustomizations = {
    // Header Settings
    header: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        logoUrl: '/logo.png',
        logoText: 'Eyejack',
        fontFamily: 'Inter, sans-serif',
        fontSize: '24px',
        height: '60px',
        showLogo: true,
        showText: true
    },
    
    // Theme Settings
    theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        accentColor: '#10b981',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
        darkMode: false
    },
    
    // Banner Settings
    banner: {
        show: true,
        text: '🔥 Flash Sale - Up to 70% Off!',
        backgroundColor: '#f97316',
        textColor: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        animation: true
    },
    
    // Navigation Settings
    navigation: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        activeColor: '#3b82f6',
        borderColor: '#e5e7eb',
        fontSize: '14px',
        showIcons: true
    },
    
    // Product Settings
    products: {
        showPrices: true,
        showRatings: true,
        showDiscounts: true,
        cardBorderRadius: '8px',
        cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
        imageAspectRatio: '1:1',
        titleFontSize: '16px',
        priceFontSize: '18px'
    },
    
    // Button Settings
    buttons: {
        primaryBackground: '#3b82f6',
        primaryText: '#ffffff',
        secondaryBackground: '#6b7280',
        secondaryText: '#ffffff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500'
    },
    
    // Typography Settings
    typography: {
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif',
        h1Size: '32px',
        h2Size: '24px',
        h3Size: '20px',
        bodySize: '16px',
        smallSize: '14px'
    },
    
    // Layout Settings
    layout: {
        containerMaxWidth: '1200px',
        sectionPadding: '20px',
        gridGap: '16px',
        borderRadius: '8px'
    },
    
    // Collections Section Settings
    collections: {
        show: true,
        title: 'Trending Collections',
        titleColor: '#1f2937',
        titleSize: '24px',
        titleFont: 'Inter, sans-serif',
        backgroundColor: '#ffffff',
        cardBackgroundColor: '#f8fafc',
        cardBorderRadius: '12px',
        cardShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textColor: '#1f2937',
        textSize: '16px',
        textFont: 'Inter, sans-serif',
        showImages: true,
        imageAspectRatio: '16:9',
        itemsPerRow: 2,
        spacing: '16px',
        padding: '20px',
        items: []
    },
    
    // Custom CSS
    customCSS: '',
    
    // Last updated
    lastUpdated: new Date().toISOString()
};

// Get all customizations
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: appCustomizations
    });
});

// Get specific customization section
router.get('/:section', (req, res) => {
    const { section } = req.params;
    
    if (!appCustomizations[section]) {
        return res.status(404).json({
            success: false,
            message: `Customization section '${section}' not found`
        });
    }
    
    res.json({
        success: true,
        data: appCustomizations[section]
    });
});

// Update specific customization section
router.put('/:section', (req, res) => {
    const { section } = req.params;
    const updates = req.body;
    
    if (!appCustomizations[section]) {
        return res.status(404).json({
            success: false,
            message: `Customization section '${section}' not found`
        });
    }
    
    // Update the section
    appCustomizations[section] = {
        ...appCustomizations[section],
        ...updates
    };
    
    appCustomizations.lastUpdated = new Date().toISOString();
    
    // Broadcast changes to all connected clients
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:updated', {
            section,
            data: appCustomizations[section],
            fullData: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: `${section} customization updated successfully`,
        data: appCustomizations[section]
    });
});

// Update multiple sections at once
router.put('/', (req, res) => {
    const updates = req.body;
    
    // Update multiple sections
    Object.keys(updates).forEach(section => {
        if (appCustomizations[section]) {
            appCustomizations[section] = {
                ...appCustomizations[section],
                ...updates[section]
            };
        }
    });
    
    appCustomizations.lastUpdated = new Date().toISOString();
    
    // Broadcast changes to all connected clients
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:bulk-updated', {
            data: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: 'Customizations updated successfully',
        data: appCustomizations
    });
});

// Reset customizations to default
router.post('/reset', (req, res) => {
    // Reset to default values (you can modify these defaults as needed)
    appCustomizations = {
        header: {
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            logoUrl: '/logo.png',
            logoText: 'Eyejack',
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            height: '60px',
            showLogo: true,
            showText: true
        },
        theme: {
            primaryColor: '#3b82f6',
            secondaryColor: '#6b7280',
            backgroundColor: '#f8fafc',
            textColor: '#1f2937',
            accentColor: '#10b981',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            darkMode: false
        },
        banner: {
            show: true,
            text: '🔥 Flash Sale - Up to 70% Off!',
            backgroundColor: '#f97316',
            textColor: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            animation: true
        },
        navigation: {
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            activeColor: '#3b82f6',
            borderColor: '#e5e7eb',
            fontSize: '14px',
            showIcons: true
        },
        products: {
            showPrices: true,
            showRatings: true,
            showDiscounts: true,
            cardBorderRadius: '8px',
            cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
            imageAspectRatio: '1:1',
            titleFontSize: '16px',
            priceFontSize: '18px'
        },
        buttons: {
            primaryBackground: '#3b82f6',
            primaryText: '#ffffff',
            secondaryBackground: '#6b7280',
            secondaryText: '#ffffff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
        },
        typography: {
            headingFont: 'Inter, sans-serif',
            bodyFont: 'Inter, sans-serif',
            h1Size: '32px',
            h2Size: '24px',
            h3Size: '20px',
            bodySize: '16px',
            smallSize: '14px'
        },
        layout: {
            containerMaxWidth: '1200px',
            sectionPadding: '20px',
            gridGap: '16px',
            borderRadius: '8px'
        },
        customCSS: '',
        lastUpdated: new Date().toISOString()
    };
    
    // Broadcast reset to all connected clients
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:reset', {
            data: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: 'Customizations reset to default values',
        data: appCustomizations
    });
});

// Export current customizations as JSON
router.get('/export/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="app-customizations.json"');
    res.json(appCustomizations);
});

// Import customizations from JSON
router.post('/import', (req, res) => {
    try {
        const importedCustomizations = req.body;
        
        // Validate the structure (basic validation)
        if (!importedCustomizations || typeof importedCustomizations !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid customization data'
            });
        }
        
        // Update customizations
        appCustomizations = {
            ...appCustomizations,
            ...importedCustomizations,
            lastUpdated: new Date().toISOString()
        };
        
        // Broadcast changes to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('customization:imported', {
                data: appCustomizations
            });
        }
        
        res.json({
            success: true,
            message: 'Customizations imported successfully',
            data: appCustomizations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error importing customizations',
            error: error.message
        });
    }
});

// Collections Management APIs

// Add new collection item
router.post('/collections/items', (req, res) => {
    const { title, image, textColor, backgroundColor } = req.body;
    
    const newItem = {
        id: `collection-${Date.now()}`,
        title: title || 'New Collection',
        image: image || '',
        show: true,
        textColor: textColor || '#1f2937',
        backgroundColor: backgroundColor || '#f8fafc'
    };
    
    appCustomizations.collections.items.push(newItem);
    appCustomizations.lastUpdated = new Date().toISOString();
    
    // Broadcast changes
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:updated', {
            section: 'collections',
            data: appCustomizations.collections,
            fullData: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: 'Collection item added successfully',
        data: newItem
    });
});

// Update collection item
router.put('/collections/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    const updates = req.body;
    
    const itemIndex = appCustomizations.collections.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }
    
    // Update the item
    appCustomizations.collections.items[itemIndex] = {
        ...appCustomizations.collections.items[itemIndex],
        ...updates
    };
    
    appCustomizations.lastUpdated = new Date().toISOString();
    
    // Broadcast changes
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:updated', {
            section: 'collections',
            data: appCustomizations.collections,
            fullData: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: 'Collection item updated successfully',
        data: appCustomizations.collections.items[itemIndex]
    });
});

// Remove collection item
router.delete('/collections/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    
    const itemIndex = appCustomizations.collections.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }
    
    // Remove the item
    const removedItem = appCustomizations.collections.items.splice(itemIndex, 1)[0];
    appCustomizations.lastUpdated = new Date().toISOString();
    
    // Broadcast changes
    const io = req.app.get('io');
    if (io) {
        io.emit('customization:updated', {
            section: 'collections',
            data: appCustomizations.collections,
            fullData: appCustomizations
        });
    }
    
    res.json({
        success: true,
        message: 'Collection item removed successfully',
        data: removedItem
    });
});

// Get specific collection item
router.get('/collections/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    
    const item = appCustomizations.collections.items.find(item => item.id === itemId);
    
    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Collection item not found'
        });
    }
    
    res.json({
        success: true,
        data: item
    });
});

module.exports = router;
