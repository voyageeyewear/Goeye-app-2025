/**
 * Real-time Integration for Eyejack Mobile App
 * This script integrates real-time functionality into your existing mobile app
 */

// Configuration
const REALTIME_SERVER_URL = 'http://localhost:3003';

// Initialize real-time client when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeRealtimeFeatures();
});

function initializeRealtimeFeatures() {
    console.log('🚀 Initializing real-time features...');
    
    // Load Socket.IO client library
    loadSocketIOClient(() => {
        // Initialize real-time client
        window.realtimeClient = new EyejackRealtimeClient(REALTIME_SERVER_URL);
        
        // Set up event handlers
        setupRealtimeEventHandlers();
        
        // Subscribe to relevant channels
        subscribeToChannels();
        
        console.log('✅ Real-time features initialized');
    });
}

function loadSocketIOClient(callback) {
    if (typeof io !== 'undefined') {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
    script.onload = callback;
    script.onerror = () => {
        console.error('❌ Failed to load Socket.IO client library');
    };
    document.head.appendChild(script);
}

function setupRealtimeEventHandlers() {
    const client = window.realtimeClient;
    
    // Connection events
    client.on('connected', () => {
        console.log('🔗 Connected to real-time server');
        showConnectionStatus(true);
        
        // Authenticate user (you can customize this based on your auth system)
        const userId = getCurrentUserId() || 'anonymous-user';
        client.authenticate(userId, 'user');
    });
    
    client.on('disconnected', (reason) => {
        console.log(`❌ Disconnected: ${reason}`);
        showConnectionStatus(false);
    });
    
    client.on('error', (error) => {
        console.error('❌ Real-time error:', error);
        showConnectionStatus(false);
    });
    
    // Product events
    client.on('products:updated', (products) => {
        console.log('📦 Products updated');
        updateProductsInUI(products);
    });
    
    client.on('product:added', (product) => {
        console.log('➕ New product added:', product.name);
        addProductToUI(product);
        showNotification(`New product available: ${product.name}`, 'success');
    });
    
    client.on('product:updated', (product) => {
        console.log('📝 Product updated:', product.name);
        updateProductInUI(product);
    });
    
    client.on('price:changed', (data) => {
        console.log(`💰 Price changed: ${data.product.name}`);
        updateProductPriceInUI(data.product);
        showNotification(`Price updated: ${data.product.name} - $${data.newPrice}`, 'info');
    });
    
    // Order events
    client.on('order:added', (order) => {
        console.log('🛒 New order created:', order.id);
        // You can add order tracking UI updates here
    });
    
    // Analytics events
    client.on('analytics:updated', (analytics) => {
        console.log('📊 Analytics updated');
        updateAnalyticsInUI(analytics);
    });
}

function subscribeToChannels() {
    // Subscribe to channels relevant to the mobile app
    window.realtimeClient.subscribe(['products', 'analytics']);
    console.log('📡 Subscribed to real-time channels');
}

// UI Update Functions

function updateProductsInUI(products) {
    // Update featured products section
    updateFeaturedProducts(products.filter(p => p.isFeatured));
    
    // Update trending collections if they contain products
    updateTrendingCollections(products);
    
    // Update any product grids or lists in your app
    updateProductGrids(products);
}

function updateFeaturedProducts(featuredProducts) {
    const featuredSection = document.querySelector('.featured-products-section .featured-carousel');
    if (!featuredSection) return;
    
    // Clear existing content
    featuredSection.innerHTML = '';
    
    // Add updated products
    featuredProducts.forEach(product => {
        const productElement = createProductElement(product);
        featuredSection.appendChild(productElement);
    });
}

function updateTrendingCollections(products) {
    // Update trending collections with latest product data
    const collectionsGrid = document.querySelector('.collections-grid');
    if (!collectionsGrid) return;
    
    // You can update collection cards with latest product counts, prices, etc.
    const collectionCards = collectionsGrid.querySelectorAll('.collection-card');
    collectionCards.forEach(card => {
        // Update card data based on products
        updateCollectionCard(card, products);
    });
}

function updateProductGrids(products) {
    // Update any product grids in glasses category sections
    const glassesGrids = document.querySelectorAll('.glasses-grid');
    glassesGrids.forEach(grid => {
        updateGlassesGrid(grid, products);
    });
}

function addProductToUI(product) {
    // Add new product to relevant sections
    if (product.isFeatured) {
        addToFeaturedProducts(product);
    }
    
    // Add to appropriate category section
    addToCategorySection(product);
    
    // Animate the addition
    animateNewProduct(product);
}

function updateProductInUI(product) {
    // Find and update existing product elements
    const productElements = document.querySelectorAll(`[data-product-id="${product.id}"]`);
    productElements.forEach(element => {
        updateProductElement(element, product);
    });
}

function updateProductPriceInUI(product) {
    // Update price displays for this product
    const priceElements = document.querySelectorAll(`[data-product-id="${product.id}"] .product-price, [data-product-id="${product.id}"] .price`);
    priceElements.forEach(element => {
        element.textContent = `$${product.price}`;
        
        // Add price change animation
        element.classList.add('price-updated');
        setTimeout(() => element.classList.remove('price-updated'), 2000);
    });
}

function updateAnalyticsInUI(analytics) {
    // Update any analytics displays in your app
    updateActiveUsersCount(analytics.activeUsers);
    updateSalesMetrics(analytics);
}

// Helper Functions

function createProductElement(product) {
    const element = document.createElement('div');
    element.className = 'product-item';
    element.setAttribute('data-product-id', product.id);
    element.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">$${product.price}</p>
            <p class="product-stock">Stock: ${product.stock}</p>
        </div>
    `;
    return element;
}

function updateProductElement(element, product) {
    const nameEl = element.querySelector('.product-name');
    const priceEl = element.querySelector('.product-price, .price');
    const stockEl = element.querySelector('.product-stock');
    const imageEl = element.querySelector('.product-image, img');
    
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `$${product.price}`;
    if (stockEl) stockEl.textContent = `Stock: ${product.stock}`;
    if (imageEl) {
        imageEl.src = product.image;
        imageEl.alt = product.name;
    }
    
    // Add update animation
    element.classList.add('product-updated');
    setTimeout(() => element.classList.remove('product-updated'), 2000);
}

function updateCollectionCard(card, products) {
    // Update collection card with latest product data
    const category = card.getAttribute('data-category');
    if (!category) return;
    
    const categoryProducts = products.filter(p => p.category === category);
    const productCount = categoryProducts.length;
    const avgPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length;
    
    // Update card content if needed
    const countEl = card.querySelector('.product-count');
    const priceEl = card.querySelector('.avg-price');
    
    if (countEl) countEl.textContent = `${productCount} products`;
    if (priceEl) priceEl.textContent = `From $${Math.floor(avgPrice)}`;
}

function updateGlassesGrid(grid, products) {
    const category = grid.getAttribute('data-category') || 'eyeglasses';
    const categoryProducts = products.filter(p => p.category === category);
    
    // Update grid with category products
    grid.innerHTML = '';
    categoryProducts.slice(0, 4).forEach(product => {
        const productCard = createGlassesCard(product);
        grid.appendChild(productCard);
    });
}

function createGlassesCard(product) {
    const card = document.createElement('div');
    card.className = 'glasses-category-card';
    card.setAttribute('data-product-id', product.id);
    card.innerHTML = `
        <div class="glasses-image-container">
            <img src="${product.image}" alt="${product.name}" class="glasses-image">
        </div>
        <h3 class="glasses-name">${product.name}</h3>
        <p class="glasses-price">$${product.price}</p>
    `;
    return card;
}

function addToFeaturedProducts(product) {
    const featuredCarousel = document.querySelector('.featured-products-section .featured-carousel');
    if (featuredCarousel) {
        const productElement = createProductElement(product);
        featuredCarousel.appendChild(productElement);
    }
}

function addToCategorySection(product) {
    const categoryGrid = document.querySelector(`[data-category="${product.category}"] .glasses-grid`);
    if (categoryGrid) {
        const productCard = createGlassesCard(product);
        categoryGrid.appendChild(productCard);
    }
}

function animateNewProduct(product) {
    // Add entrance animation for new products
    const productElements = document.querySelectorAll(`[data-product-id="${product.id}"]`);
    productElements.forEach(element => {
        element.classList.add('new-product-animation');
        setTimeout(() => element.classList.remove('new-product-animation'), 3000);
    });
}

function updateActiveUsersCount(count) {
    // Update active users display if you have one
    const activeUsersEl = document.querySelector('.active-users-count');
    if (activeUsersEl) {
        activeUsersEl.textContent = count;
    }
}

function updateSalesMetrics(analytics) {
    // Update sales metrics displays
    const totalSalesEl = document.querySelector('.total-sales');
    const totalOrdersEl = document.querySelector('.total-orders');
    
    if (totalSalesEl) totalSalesEl.textContent = `$${analytics.totalSales}`;
    if (totalOrdersEl) totalOrdersEl.textContent = analytics.totalOrders;
}

function showConnectionStatus(connected) {
    // Show connection status indicator
    let statusIndicator = document.querySelector('.realtime-status');
    
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.className = 'realtime-status';
        document.body.appendChild(statusIndicator);
    }
    
    if (connected) {
        statusIndicator.className = 'realtime-status connected';
        statusIndicator.innerHTML = '🟢 Live';
    } else {
        statusIndicator.className = 'realtime-status disconnected';
        statusIndicator.innerHTML = '🔴 Offline';
    }
}

function showNotification(message, type = 'info') {
    // Show notification to user
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getCurrentUserId() {
    // Get current user ID from your auth system
    // This is a placeholder - implement based on your auth
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

// CSS for real-time features
const realtimeCSS = `
.realtime-status {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    z-index: 1000;
    transition: all 0.3s ease;
}

.realtime-status.connected {
    background: rgba(34, 197, 94, 0.9);
    color: white;
}

.realtime-status.disconnected {
    background: rgba(239, 68, 68, 0.9);
    color: white;
}

.product-updated {
    animation: productUpdatePulse 2s ease-out;
}

.price-updated {
    animation: priceChangePulse 2s ease-out;
}

.new-product-animation {
    animation: newProductSlideIn 3s ease-out;
}

@keyframes productUpdatePulse {
    0% { background: rgba(34, 197, 94, 0.2); }
    50% { background: rgba(34, 197, 94, 0.4); }
    100% { background: transparent; }
}

@keyframes priceChangePulse {
    0% { background: rgba(59, 130, 246, 0.3); transform: scale(1); }
    50% { background: rgba(59, 130, 246, 0.6); transform: scale(1.05); }
    100% { background: transparent; transform: scale(1); }
}

@keyframes newProductSlideIn {
    0% { 
        opacity: 0; 
        transform: translateY(-20px) scale(0.9);
        background: rgba(168, 85, 247, 0.2);
    }
    50% { 
        opacity: 1; 
        transform: translateY(0) scale(1.02);
        background: rgba(168, 85, 247, 0.4);
    }
    100% { 
        opacity: 1; 
        transform: translateY(0) scale(1);
        background: transparent;
    }
}

.notification {
    position: fixed;
    top: 50px;
    right: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1001;
    max-width: 300px;
    animation: notificationSlideIn 0.3s ease-out;
}

.notification-success {
    background: rgba(34, 197, 94, 0.95);
}

.notification-info {
    background: rgba(59, 130, 246, 0.95);
}

.notification-warning {
    background: rgba(245, 158, 11, 0.95);
}

.notification-error {
    background: rgba(239, 68, 68, 0.95);
}

@keyframes notificationSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = realtimeCSS;
document.head.appendChild(style);

console.log('📡 Real-time integration script loaded');

// Export for global access
window.EyejackRealtimeIntegration = {
    initialize: initializeRealtimeFeatures,
    updateProducts: updateProductsInUI,
    showNotification: showNotification
};
