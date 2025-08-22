/**
 * Real-time WebSocket Client for Eyejack Frontend
 * Handles all real-time communication with the backend
 */

class EyejackRealtimeClient {
    constructor(serverUrl = 'http://localhost:3002') {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Set();
        this.eventHandlers = new Map();
        
        // Auto-connect on initialization
        this.connect();
    }

    // Connect to WebSocket server
    connect() {
        try {
            // Load Socket.IO client library if not already loaded
            if (typeof io === 'undefined') {
                this.loadSocketIOClient(() => this.initializeSocket());
            } else {
                this.initializeSocket();
            }
        } catch (error) {
            console.error('❌ Failed to connect to real-time server:', error);
            this.scheduleReconnect();
        }
    }

    // Load Socket.IO client library dynamically
    loadSocketIOClient(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        script.onload = callback;
        script.onerror = () => {
            console.error('❌ Failed to load Socket.IO client library');
        };
        document.head.appendChild(script);
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
            forceNew: true
        });

        // Connection events
        this.socket.on('connect', () => {
            console.log('🔗 Connected to real-time server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
            
            // Re-subscribe to channels after reconnection
            if (this.subscriptions.size > 0) {
                this.socket.emit('subscribe', Array.from(this.subscriptions));
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected from real-time server: ${reason}`);
            this.isConnected = false;
            this.emit('disconnected', reason);
            
            // Auto-reconnect unless manually disconnected
            if (reason !== 'io client disconnect') {
                this.scheduleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.emit('error', error);
            this.scheduleReconnect();
        });

        // Real-time data events
        this.socket.on('products:data', (data) => {
            this.emit('products:updated', data);
        });

        this.socket.on('products:added', (product) => {
            this.emit('product:added', product);
        });

        this.socket.on('products:updated', (product) => {
            this.emit('product:updated', product);
        });

        this.socket.on('products:deleted', (data) => {
            this.emit('product:deleted', data);
        });

        this.socket.on('products:price-changed', (data) => {
            this.emit('price:changed', data);
        });

        this.socket.on('orders:data', (data) => {
            this.emit('orders:updated', data);
        });

        this.socket.on('orders:added', (order) => {
            this.emit('order:added', order);
        });

        this.socket.on('orders:updated', (order) => {
            this.emit('order:updated', order);
        });

        this.socket.on('analytics:updated', (analytics) => {
            this.emit('analytics:updated', analytics);
        });

        this.socket.on('pong', (data) => {
            this.emit('pong', data);
        });
    }

    // Schedule reconnection
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('max_reconnect_attempts');
        }
    }

    // Subscribe to real-time data channels
    subscribe(channels) {
        if (!Array.isArray(channels)) {
            channels = [channels];
        }
        
        channels.forEach(channel => this.subscriptions.add(channel));
        
        if (this.isConnected) {
            this.socket.emit('subscribe', channels);
            console.log(`📡 Subscribed to: ${channels.join(', ')}`);
        }
    }

    // Unsubscribe from channels
    unsubscribe(channels) {
        if (!Array.isArray(channels)) {
            channels = [channels];
        }
        
        channels.forEach(channel => this.subscriptions.delete(channel));
        
        if (this.isConnected) {
            this.socket.emit('unsubscribe', channels);
            console.log(`📡 Unsubscribed from: ${channels.join(', ')}`);
        }
    }

    // Authenticate with the server
    authenticate(userId, role = 'user') {
        if (this.isConnected) {
            this.socket.emit('auth', { userId, role });
            console.log(`👤 Authenticated as: ${userId} (${role})`);
        }
    }

    // Request specific data
    getProducts() {
        if (this.isConnected) {
            this.socket.emit('get:products');
        }
    }

    getOrders() {
        if (this.isConnected) {
            this.socket.emit('get:orders');
        }
    }

    getAnalytics() {
        if (this.isConnected) {
            this.socket.emit('get:analytics');
        }
    }

    // Send ping to check connection
    ping() {
        if (this.isConnected) {
            this.socket.emit('ping');
        }
    }

    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: Array.from(this.subscriptions)
        };
    }
}

// Auto-initialize global client instance
window.EyejackRealtime = new EyejackRealtimeClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EyejackRealtimeClient;
}
