// WebSocket server for live rendering functionality
class LiveRenderingWebSocketServer {
  constructor() {
    this.clients = new Set();
    this.instance = null;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new LiveRenderingWebSocketServer();
    }
    return this.instance;
  }

  addClient(client) {
    this.clients.add(client);
    console.log(`📱 Client connected. Total clients: ${this.clients.size}`);
  }

  removeClient(client) {
    this.clients.delete(client);
    console.log(`📱 Client disconnected. Total clients: ${this.clients.size}`);
  }

  broadcastConfigUpdate(shop, config) {
    const message = JSON.stringify({
      type: 'CONFIG_UPDATE',
      shop: shop,
      config: config,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Broadcasting to ${this.clients.size} clients:`, message);

    this.clients.forEach(client => {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        } else {
          this.removeClient(client);
        }
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        this.removeClient(client);
      }
    });
  }

  broadcast(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.clients.forEach(client => {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(messageStr);
        } else {
          this.removeClient(client);
        }
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        this.removeClient(client);
      }
    });
  }

  getClientCount() {
    return this.clients.size;
  }
}

export default LiveRenderingWebSocketServer;

