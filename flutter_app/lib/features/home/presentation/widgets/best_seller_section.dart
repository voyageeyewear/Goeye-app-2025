import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/live_rendering_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/models/product.dart';
import '../../../../core/routes/app_router.dart';
import '../../../../shared/presentation/widgets/product_card.dart';

final bestSellersProvider = FutureProvider<List<Product>>((ref) async {
  try {
    // In a real implementation, you'd have a "best sellers" tag or sort option
    return await ApiService.getProducts(
      first: 10,
      query: 'tag:bestseller', // Assuming you tag bestsellers in Shopify
    );
  } catch (e) {
    print('Error fetching best sellers: $e');
    // Fallback to regular products if no bestsellers found
    try {
      return await ApiService.getProducts(first: 10);
    } catch (e) {
      return [];
    }
  }
});

class BestSellerSection extends ConsumerWidget {
  const BestSellerSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appConfig = ref.watch(appConfigProvider);
    final bestSellerConfig = appConfig['bestSeller'] as Map<String, dynamic>? ?? {};
    
    final isEnabled = bestSellerConfig['enabled'] as bool? ?? true;
    
    if (!isEnabled) {
      return const SizedBox.shrink();
    }
    
    final title = bestSellerConfig['title'] as String? ?? 'Best Sellers';
    final subtitle = bestSellerConfig['subtitle'] as String? ?? 'Our most popular products';
    final showViewAll = bestSellerConfig['showViewAll'] as bool? ?? true;
    final layout = bestSellerConfig['layout'] as String? ?? 'horizontal';
    final itemsToShow = (bestSellerConfig['itemsToShow'] as num?)?.toInt() ?? 10;
    final showAddToCart = bestSellerConfig['showAddToCart'] as bool? ?? true;

    final bestSellersAsync = ref.watch(bestSellersProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.star,
                          color: Colors.amber,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          title,
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                      ],
                    ),
                    if (subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          subtitle,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (showViewAll)
                TextButton(
                  onPressed: () => context.go(AppRoutes.products + '?tag=bestseller'),
                  child: const Text('View All'),
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Products Content
          bestSellersAsync.when(
            data: (products) {
              if (products.isEmpty) {
                return _buildEmptyState();
              }
              
              final displayProducts = products.take(itemsToShow).toList();
              
              return layout == 'horizontal'
                  ? _buildHorizontalLayout(displayProducts, showAddToCart)
                  : _buildGridLayout(displayProducts, showAddToCart);
            },
            loading: () => _buildLoadingState(layout),
            error: (error, stack) => _buildErrorState(),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalLayout(List<Product> products, bool showAddToCart) {
    return SizedBox(
      height: showAddToCart ? 300 : 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return Container(
            width: 200,
            margin: EdgeInsets.only(right: index < products.length - 1 ? 12 : 0),
            child: ProductCard(
              product: product,
              showAddToCart: showAddToCart,
              onAddToCart: () {
                // TODO: Implement add to cart functionality
                _showAddToCartSnackBar(product);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildGridLayout(List<Product> products, bool showAddToCart) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.7,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        return ProductCard(
          product: product,
          showAddToCart: showAddToCart,
          onAddToCart: () {
            // TODO: Implement add to cart functionality
            _showAddToCartSnackBar(product);
          },
        );
      },
    );
  }

  Widget _buildLoadingState(String layout) {
    if (layout == 'horizontal') {
      return SizedBox(
        height: 280,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 5,
          itemBuilder: (context, index) {
            return Container(
              width: 200,
              margin: EdgeInsets.only(right: index < 4 ? 12 : 0),
              child: const ProductCardSkeleton(),
            );
          },
        ),
      );
    }
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.7,
      ),
      itemCount: 6,
      itemBuilder: (context, index) {
        return const ProductCardSkeleton();
      },
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.star_outline,
              size: 48,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'No best sellers available',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.red,
            ),
            SizedBox(height: 16),
            Text(
              'Failed to load best sellers',
              style: TextStyle(
                fontSize: 16,
                color: Colors.red,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddToCartSnackBar(Product product) {
    // This would typically use a SnackBar messenger from context
    // For now, it's a placeholder
    print('Adding ${product.title} to cart');
  }
} 