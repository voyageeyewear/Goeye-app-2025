const express = require('express');
// const Product = require('../models/Product'); // Commented for development
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Sample products data for development
const sampleProducts = [
    {
        name: "Black Dashers",
        description: "Stylish black eyeglasses perfect for everyday wear",
        shortDescription: "Classic black frames with modern design",
        sku: "BD001",
        category: "eyeglasses",
        subcategory: "men",
        brand: "Eyejack",
        price: { regular: 64, currency: "USD" },
        images: [
            {
                url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
                alt: "Black Dashers Eyeglasses",
                isPrimary: true
            }
        ],
        specifications: {
            frameWidth: 140,
            lensWidth: 52,
            bridgeWidth: 18,
            templeLength: 145,
            frameHeight: 40,
            weight: 25,
            material: { frame: "acetate", lens: "polycarbonate" },
            frameShape: "rectangular",
            rimType: "full-rim"
        },
        features: ["uv-protection", "scratch-resistant", "lightweight"],
        colors: [{ name: "Black", hex: "#000000" }],
        sizes: [{ name: "M", frameWidth: 140, available: true }],
        inventory: { stock: 50, lowStockThreshold: 10, trackInventory: true },
        status: "active",
        tags: ["men", "classic", "everyday"],
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: "Pink Dashers",
        description: "Trendy pink eyeglasses for fashion-forward women",
        shortDescription: "Chic pink frames with elegant design",
        sku: "PD001",
        category: "eyeglasses",
        subcategory: "women",
        brand: "Eyejack",
        price: { regular: 95, currency: "USD" },
        images: [
            {
                url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
                alt: "Pink Dashers Eyeglasses",
                isPrimary: true
            }
        ],
        specifications: {
            frameWidth: 135,
            lensWidth: 50,
            bridgeWidth: 17,
            templeLength: 140,
            frameHeight: 38,
            weight: 22,
            material: { frame: "acetate", lens: "polycarbonate" },
            frameShape: "cat-eye",
            rimType: "full-rim"
        },
        features: ["uv-protection", "anti-reflective", "lightweight"],
        colors: [{ name: "Pink", hex: "#FFC0CB" }],
        sizes: [{ name: "S", frameWidth: 135, available: true }],
        inventory: { stock: 30, lowStockThreshold: 10, trackInventory: true },
        status: "active",
        tags: ["women", "trendy", "fashion"],
        isFeatured: true,
        isNewArrival: true
    }
];

// @route   GET /api/v1/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            featured,
            newArrival,
            sort = 'createdAt'
        } = req.query;

        // Build query
        const query = { status: 'active' };
        
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (brand) query.brand = new RegExp(brand, 'i');
        if (featured === 'true') query.isFeatured = true;
        if (newArrival === 'true') query.isNewArrival = true;
        
        if (minPrice || maxPrice) {
            query['price.regular'] = {};
            if (minPrice) query['price.regular'].$gte = Number(minPrice);
            if (maxPrice) query['price.regular'].$lte = Number(maxPrice);
        }

        // Sort options
        let sortOption = {};
        switch (sort) {
            case 'price-low':
                sortOption = { 'price.regular': 1 };
                break;
            case 'price-high':
                sortOption = { 'price.regular': -1 };
                break;
            case 'rating':
                sortOption = { 'ratings.average': -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        // For development, return sample products
        let products = sampleProducts.filter(product => {
            if (category && product.category !== category) return false;
            if (subcategory && product.subcategory !== subcategory) return false;
            if (featured === 'true' && !product.isFeatured) return false;
            if (newArrival === 'true' && !product.isNewArrival) return false;
            return true;
        });

        const total = products.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        products = products.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    hasNextPage: endIndex < total,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving products'
        });
    }
});

// @route   GET /api/v1/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        
        const featuredProducts = sampleProducts
            .filter(product => product.isFeatured)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                products: featuredProducts
            }
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving featured products'
        });
    }
});

// @route   GET /api/v1/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const categories = [
            {
                name: 'eyeglasses',
                label: 'Eyeglasses',
                subcategories: [
                    { name: 'men', label: 'Men' },
                    { name: 'women', label: 'Women' },
                    { name: 'kids', label: 'Kids' },
                    { name: 'unisex', label: 'Unisex' }
                ]
            },
            {
                name: 'sunglasses',
                label: 'Sunglasses',
                subcategories: [
                    { name: 'men', label: 'Men' },
                    { name: 'women', label: 'Women' },
                    { name: 'kids', label: 'Kids' },
                    { name: 'unisex', label: 'Unisex' }
                ]
            }
        ];

        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving categories'
        });
    }
});

// @route   GET /api/v1/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // For development, find by SKU or index
        const product = sampleProducts.find(p => 
            p.sku === id.toUpperCase() || 
            sampleProducts.indexOf(p) === parseInt(id)
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: { product }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving product'
        });
    }
});

// @route   GET /api/v1/products/search
// @desc    Search products
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 12 } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Simple search implementation for development
        const searchResults = sampleProducts.filter(product =>
            product.name.toLowerCase().includes(q.toLowerCase()) ||
            product.description.toLowerCase().includes(q.toLowerCase()) ||
            product.brand.toLowerCase().includes(q.toLowerCase()) ||
            product.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
        ).slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                products: searchResults,
                query: q,
                total: searchResults.length
            }
        });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching products'
        });
    }
});

module.exports = router;
