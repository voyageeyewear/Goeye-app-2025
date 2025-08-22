const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            products: '/api/v1/products',
            cart: '/api/v1/cart',
            orders: '/api/v1/orders',
            wishlist: '/api/v1/wishlist',
            docs: '/api/v1/docs'
        }
    });
};

module.exports = notFound;
