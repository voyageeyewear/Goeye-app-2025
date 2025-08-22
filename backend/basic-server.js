const http = require('http');
const url = require('url');

const PORT = 3002;

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Routes
    if (path === '/backend' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            message: '👓 Welcome to Eyejack Backend API',
            version: '1.0.0',
            status: 'running',
            port: PORT,
            endpoints: {
                health: '/health',
                products: '/api/v1/products',
                auth: '/api/v1/auth/login',
                cart: '/api/v1/cart'
            },
            timestamp: new Date().toISOString()
        }, null, 2));
    }
    else if (path === '/health' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'OK',
            message: 'Eyejack Backend Server is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }, null, 2));
    }
    else if (path === '/api/v1/products' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            data: {
                products: [
                    {
                        id: '1',
                        name: 'Black Dashers',
                        price: 64,
                        category: 'eyeglasses',
                        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'
                    },
                    {
                        id: '2',
                        name: 'Pink Dashers',
                        price: 95,
                        category: 'eyeglasses',
                        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                    }
                ]
            }
        }, null, 2));
    }
    else if (path === '/api/v1/auth/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: '1',
                            email: data.email || 'user@example.com',
                            firstName: 'John',
                            lastName: 'Doe'
                        },
                        token: 'sample_jwt_token_for_development'
                    }
                }, null, 2));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON'
                }));
            }
        });
    }
    else if (path === '/api/v1/cart' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            data: {
                cart: {
                    items: [
                        {
                            id: '1',
                            productId: '1',
                            name: 'Black Dashers',
                            price: 64,
                            quantity: 1,
                            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'
                        },
                        {
                            id: '2',
                            productId: '2',
                            name: 'Pink Dashers',
                            price: 95,
                            quantity: 1,
                            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                        }
                    ],
                    totals: {
                        subtotal: 159,
                        tax: 13.52,
                        shipping: 0,
                        total: 172.52
                    },
                    itemCount: 2
                }
            }
        }, null, 2));
    }
    else {
        // 404 Not Found
        res.writeHead(404);
        res.end(JSON.stringify({
            success: false,
            message: `Route ${path} not found`,
            availableRoutes: [
                '/backend',
                '/health',
                '/api/v1/products',
                '/api/v1/auth/login',
                '/api/v1/cart'
            ]
        }, null, 2));
    }
});

server.listen(PORT, () => {
    console.log(`
🚀 Eyejack Backend Server Started Successfully!
📍 Server running on: http://localhost:${PORT}
🌐 Backend endpoint: http://localhost:${PORT}/backend
🏥 Health check: http://localhost:${PORT}/health
📦 Products API: http://localhost:${PORT}/api/v1/products
🔐 Login API: http://localhost:${PORT}/api/v1/auth/login
🛒 Cart API: http://localhost:${PORT}/api/v1/cart
🌍 Environment: development
    `);
});

module.exports = server;
