import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/product.dart';
import '../models/collection.dart';
import '../models/cart.dart';

class ApiService {
  static late Dio _dio;
  static late Dio _shopifyDio;
  
  static Future<void> initialize() async {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.backendApiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    _shopifyDio = Dio(BaseOptions(
      baseUrl: '${AppConfig.shopifyBaseUrl}/api/2023-10/graphql.json',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': AppConfig.shopifyStorefrontToken,
      },
    ));
    
    // Add interceptors for logging
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('[API] $obj'),
    ));
    
    _shopifyDio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('[Shopify] $obj'),
    ));
  }
  
  // Products API
  static Future<List<Product>> getProducts({
    int first = 20,
    String? after,
    String? query,
    String? sortKey,
  }) async {
    const queryString = '''
      query getProducts(\$first: Int!, \$after: String, \$query: String, \$sortKey: ProductSortKeys) {
        products(first: \$first, after: \$after, query: \$query, sortBy: \$sortKey) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              vendor
              productType
              tags
              createdAt
              updatedAt
              availableForSale
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    ''';
    
    try {
      final response = await _shopifyDio.post('', data: {
        'query': queryString,
        'variables': {
          'first': first,
          'after': after,
          'query': query,
          'sortKey': sortKey,
        },
      });
      
      final data = response.data['data']['products'];
      final List<dynamic> productEdges = data['edges'];
      
      return productEdges
          .map((edge) => Product.fromJson(edge['node']))
          .toList();
    } catch (e) {
      print('Error fetching products: $e');
      throw Exception('Failed to fetch products: $e');
    }
  }
  
  static Future<Product?> getProduct(String handle) async {
    const queryString = '''
      query getProduct(\$handle: String!) {
        product(handle: \$handle) {
          id
          title
          description
          handle
          vendor
          productType
          tags
          createdAt
          updatedAt
          availableForSale
          images(first: 20) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
                image {
                  id
                  url
                  altText
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    ''';
    
    try {
      final response = await _shopifyDio.post('', data: {
        'query': queryString,
        'variables': {'handle': handle},
      });
      
      final productData = response.data['data']['product'];
      if (productData == null) return null;
      
      return Product.fromJson(productData);
    } catch (e) {
      print('Error fetching product: $e');
      throw Exception('Failed to fetch product: $e');
    }
  }
  
  // Collections API
  static Future<List<Collection>> getCollections({
    int first = 20,
    String? after,
    String? query,
  }) async {
    const queryString = '''
      query getCollections(\$first: Int!, \$after: String, \$query: String) {
        collections(first: \$first, after: \$after, query: \$query) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              image {
                id
                url
                altText
                width
                height
              }
              products(first: 10) {
                edges {
                  node {
                    id
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ''';
    
    try {
      final response = await _shopifyDio.post('', data: {
        'query': queryString,
        'variables': {
          'first': first,
          'after': after,
          'query': query,
        },
      });
      
      final data = response.data['data']['collections'];
      final List<dynamic> collectionEdges = data['edges'];
      
      return collectionEdges
          .map((edge) => Collection.fromJson(edge['node']))
          .toList();
    } catch (e) {
      print('Error fetching collections: $e');
      throw Exception('Failed to fetch collections: $e');
    }
  }
  
  // Cart API (using Storefront API)
  static Future<Cart> createCart() async {
    try {
      // Return an empty cart initially, we'll create the cart on first add
      return Cart.empty();
    } catch (e) {
      print('Error creating cart: $e');
      throw Exception('Failed to create cart: $e');
    }
  }
  
  static Future<Cart> getCart(String cartId) async {
    try {
      final response = await _dio.get('/api/cart?cartId=$cartId');
      
      if (response.data['success'] == true) {
        return _convertStorefrontCartToCart(response.data['cart']);
      } else {
        throw Exception(response.data['error'] ?? 'Failed to get cart');
      }
    } catch (e) {
      print('Error fetching cart: $e');
      throw Exception('Failed to fetch cart: $e');
    }
  }
  
  static Future<Cart> addToCart(String cartId, String productId, String variantId, int quantity) async {
    try {
      FormData formData;
      
      if (cartId.isEmpty) {
        // Create new cart with first item
        formData = FormData.fromMap({
          'action': 'create',
          'variantId': variantId,
          'quantity': quantity.toString(),
        });
      } else {
        // Update existing cart
        formData = FormData.fromMap({
          'action': 'update',
          'cartId': cartId,
          'variantId': variantId,
          'quantity': quantity.toString(),
          'updateAction': 'add',
        });
      }
      
      final response = await _dio.post('/api/cart', data: formData);
      
      if (response.data['success'] == true) {
        return _convertStorefrontCartToCart(response.data['cart']);
      } else {
        throw Exception(response.data['error'] ?? 'Failed to add to cart');
      }
    } catch (e) {
      print('Error adding to cart: $e');
      throw Exception('Failed to add to cart: $e');
    }
  }
  
  static Future<Cart> updateCartItem(String cartId, String variantId, int quantity) async {
    try {
      final formData = FormData.fromMap({
        'action': 'update',
        'cartId': cartId,
        'variantId': variantId,
        'quantity': quantity.toString(),
        'updateAction': 'update_quantity',
      });
      
      final response = await _dio.post('/api/cart', data: formData);
      
      if (response.data['success'] == true) {
        return _convertStorefrontCartToCart(response.data['cart']);
      } else {
        throw Exception(response.data['error'] ?? 'Failed to update cart');
      }
    } catch (e) {
      print('Error updating cart item: $e');
      throw Exception('Failed to update cart item: $e');
    }
  }
  
  static Future<Cart> removeFromCart(String cartId, String variantId) async {
    try {
      final formData = FormData.fromMap({
        'action': 'update',
        'cartId': cartId,
        'variantId': variantId,
        'updateAction': 'remove',
      });
      
      final response = await _dio.post('/api/cart', data: formData);
      
      if (response.data['success'] == true && response.data['cart'] != null) {
        return _convertStorefrontCartToCart(response.data['cart']);
      } else {
        // Cart was cleared, return empty cart
        return Cart.empty();
      }
    } catch (e) {
      print('Error removing from cart: $e');
      throw Exception('Failed to remove from cart: $e');
    }
  }

  // Helper function to convert Storefront cart to Cart model
  static Cart _convertStorefrontCartToCart(Map<String, dynamic> storefrontCart) {
    try {
      // Convert line items
      final List<CartLine> lines = [];
      if (storefrontCart['lines'] != null) {
        for (final line in storefrontCart['lines']) {
          final merchandise = line['merchandise'];
          
          // Create ProductVariant for the cart line
          final cartVariant = ProductVariant(
            id: merchandise['id'],
            title: merchandise['title'],
            price: Price(
              amount: merchandise['price']['amount'].toString(),
              currencyCode: merchandise['price']['currencyCode'],
            ),
            compareAtPrice: null,
            availableForSale: true,
            selectedOptions: [],
          );
          
          // Create CartLine
          final cartLine = CartLine(
            id: line['id'],
            quantity: line['quantity'],
            merchandise: cartVariant,
            totalAmount: Price(
              amount: line['totalAmount']['amount'].toString(),
              currencyCode: line['totalAmount']['currencyCode'],
            ),
          );
          
          lines.add(cartLine);
        }
      }
      
      return Cart(
        id: storefrontCart['id'],
        lines: lines,
        totalAmount: Price(
          amount: storefrontCart['totalAmount']['amount']?.toString() ?? '0.00',
          currencyCode: storefrontCart['totalAmount']['currencyCode'] ?? 'INR',
        ),
        subtotalAmount: Price(
          amount: storefrontCart['subtotalAmount']['amount']?.toString() ?? '0.00',
          currencyCode: storefrontCart['subtotalAmount']['currencyCode'] ?? 'INR',
        ),
        taxes: [], // Simplified for now
        createdAt: DateTime.parse(storefrontCart['createdAt'] ?? DateTime.now().toIso8601String()),
        updatedAt: DateTime.parse(storefrontCart['updatedAt'] ?? DateTime.now().toIso8601String()),
        checkoutUrl: storefrontCart['checkoutUrl'],
      );
    } catch (e) {
      print('Error converting storefront cart to cart: $e');
      throw Exception('Failed to convert cart data: $e');
    }
  }
  
  // Checkout API
  static Future<String> createCheckoutUrl(String cartId) async {
    try {
      final response = await _dio.post('/api/checkout/create', data: {
        'cartId': cartId,
      });
      return response.data['checkoutUrl'];
    } catch (e) {
      print('Error creating checkout: $e');
      throw Exception('Failed to create checkout: $e');
    }
  }
  
  // App Configuration API (for live rendering)
  static Future<Map<String, dynamic>> getAppConfig() async {
    try {
      final response = await _dio.get('/api/app-config');
      return response.data;
    } catch (e) {
      print('Error fetching app config: $e');
      throw Exception('Failed to fetch app config: $e');
    }
  }
  
  static Future<void> updateAppConfig(Map<String, dynamic> config) async {
    try {
      await _dio.post('/api/app-config', data: config);
    } catch (e) {
      print('Error updating app config: $e');
      throw Exception('Failed to update app config: $e');
    }
  }
} 