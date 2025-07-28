import { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class LiveRenderingWebSocketServer {
  constructor(port = 8080) {
    // Prevent multiple instances on the same port
    if (LiveRenderingWebSocketServer.instance) {
      console.log(`🔄 WebSocket server already running on port ${port}`);
      return LiveRenderingWebSocketServer.instance;
    }

    try {
      this.wss = new WebSocketServer({ port });
      this.clients = new Map(); // Map of shop -> Set of WebSocket connections
      this.setupEventHandlers();
      console.log(`🚀 WebSocket server running on port ${port}`);
      
      LiveRenderingWebSocketServer.instance = this;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} already in use, using existing WebSocket server`);
        return LiveRenderingWebSocketServer.instance;
      }
      throw error;
    }
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, request) => {
      console.log('📱 New WebSocket connection');
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('📱 WebSocket connection closed');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('📱 WebSocket error:', error);
        this.removeClient(ws);
      });

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          this.send(ws, { type: 'ping' });
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    this.wss.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log('⚠️  WebSocket server port already in use');
      } else {
        console.error('🚫 WebSocket server error:', error);
      }
    });
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'auth':
          this.handleAuth(ws, data.payload);
          break;
        case 'pong':
          // Client responded to ping
          break;
        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('📱 Error handling message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  handleAuth(ws, payload) {
    const { shop, token } = payload;
    
    // Simple token validation for development
    // In production, validate against Shopify API
    if (this.validateTokenAndGetShop(token)) {
      ws.shop = shop || 'development';
      this.addClient(ws.shop, ws);
      
      this.send(ws, {
        type: 'auth_success',
        message: 'Authentication successful'
      });

      // Send current configuration
      this.getCurrentConfig(ws.shop).then(config => {
        if (config) {
          this.send(ws, {
            type: 'config_update',
            payload: config
          });
        }
      });
    } else {
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  validateTokenAndGetShop(token) {
    // For development, accept any token
    // In production, validate against Shopify
    return true;
  }

  async getCurrentConfig(shop) {
    try {
      const config = await prisma.appConfig.findUnique({
        where: { shop }
      });
      
      return config ? JSON.parse(config.configuration) : this.getDefaultConfig();
    } catch (error) {
      console.error('Error fetching config:', error);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      announcementBar: {
        enabled: true,
        text: "🎉 Welcome to Eyejack Mobile App! Live Rendering System Active 🚀",
        backgroundColor: "#2563EB",
        textColor: "#FFFFFF"
      },
      header: {
        title: "Eyejack",
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937"
      }
    };
  }

  addClient(shop, ws) {
    if (!this.clients.has(shop)) {
      this.clients.set(shop, new Set());
    }
    this.clients.get(shop).add(ws);
    console.log(`📱 Client added for shop: ${shop}`);
  }

  removeClient(ws) {
    if (ws.shop && this.clients.has(ws.shop)) {
      this.clients.get(ws.shop).delete(ws);
      if (this.clients.get(ws.shop).size === 0) {
        this.clients.delete(ws.shop);
      }
      console.log(`📱 Client removed for shop: ${ws.shop}`);
    }
  }

  broadcastToShop(shop, message) {
    if (this.clients.has(shop)) {
      const shopClients = this.clients.get(shop);
      shopClients.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
          this.send(ws, message);
        } else {
          shopClients.delete(ws);
        }
      });
    }
  }

  send(ws, data) {
    try {
      ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  sendError(ws, message) {
    this.send(ws, {
      type: 'error',
      message
    });
  }

  broadcastConfigUpdate(shop, config) {
    this.broadcastToShop(shop, {
      type: 'config_update',
      payload: config
    });
  }

  static instance = null;

  static getInstance(port) {
    if (!LiveRenderingWebSocketServer.instance) {
      LiveRenderingWebSocketServer.instance = new LiveRenderingWebSocketServer(port);
    }
    return LiveRenderingWebSocketServer.instance;
  }

  static reset() {
    if (LiveRenderingWebSocketServer.instance) {
      try {
        LiveRenderingWebSocketServer.instance.wss.close();
      } catch (error) {
        console.log('WebSocket server already closed');
      }
      LiveRenderingWebSocketServer.instance = null;
    }
  }
}

export default LiveRenderingWebSocketServer; 