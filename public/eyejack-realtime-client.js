/**
 * Simplified Real-time Client for Eyejack Mobile App
 * Works with your existing mobile-app.html
 */

class EyejackRealtimeClient {
    constructor(serverUrl = 'http://localhost:3001') {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.eventHandlers = new Map();
        
        // Auto-connect
        this.connect();
    }

    connect() {
        if (typeof io === 'undefined') {
            this.loadSocketIO(() => this.initSocket());
        } else {
            this.initSocket();
        }
    }

    loadSocketIO(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    initSocket() {
        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('🔗 Connected to Eyejack real-time server');
            this.emit('connected');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('❌ Disconnected from real-time server');
            this.emit('disconnected');
        });

        // Product events
        this.socket.on('products:data', (data) => this.emit('products:updated', data));
        this.socket.on('products:added', (data) => this.emit('product:added', data));
        this.socket.on('products:updated', (data) => this.emit('product:updated', data));
        this.socket.on('products:price-changed', (data) => this.emit('price:changed', data));
        
        // Order events
        this.socket.on('orders:added', (data) => this.emit('order:added', data));
        
        // Analytics events
        this.socket.on('analytics:updated', (data) => this.emit('analytics:updated', data));
    }

    subscribe(channels) {
        if (this.isConnected) {
            this.socket.emit('subscribe', Array.isArray(channels) ? channels : [channels]);
        }
    }

    authenticate(userId, role = 'user') {
        if (this.isConnected) {
            this.socket.emit('auth', { userId, role });
        }
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => handler(data));
        }
    }

    getProducts() {
        if (this.isConnected) {
            this.socket.emit('get:products');
        }
    }
}

// Auto-initialize when script loads
window.EyejackRealtime = new EyejackRealtimeClient();
