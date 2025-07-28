import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/live_rendering_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/models/product.dart';
import '../../../../core/routes/app_router.dart';
import '../../../../shared/presentation/widgets/product_card.dart';

final newArrivalsProvider = FutureProvider<List<Product>>((ref) async {
  try {
    return await ApiService.getProducts(
      first: 10,
      sortKey: 'CREATED_AT',
    );
  } catch (e) {
    print('Error fetching new arrivals: $e');
    return [];
  }
});

class NewArrivalsSection extends ConsumerWidget {
  const NewArrivalsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appConfig = ref.watch(appConfigProvider);
    final newArrivalsConfig = appConfig['newArrivals'] as Map<String, dynamic>? ?? {};
    
    final isEnabled = newArrivalsConfig['enabled'] as bool? ?? true;
    
    if (!isEnabled) {
      return const SizedBox.shrink();
    }
    
    final title = newArrivalsConfig['title'] as String? ?? 'New Arrivals';
    final subtitle = newArrivalsConfig['subtitle'] as String? ?? 'Check out our latest products';
    final showViewAll = newArrivalsConfig['showViewAll'] as bool? ?? true;
    final layout = newArrivalsConfig['layout'] as String? ?? 'horizontal'; // horizontal or grid
    final itemsToShow = (newArrivalsConfig['itemsToShow'] as num?)?.toInt() ?? 10;

    final newArrivalsAsync = ref.watch(newArrivalsProvider);

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
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineLarge,
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
                  onPressed: () => context.go(AppRoutes.productsWithSort('CREATED_AT')),
                  child: const Text('View All'),
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Products Content
          newArrivalsAsync.when(
            data: (products) {
              if (products.isEmpty) {
                return _buildEmptyState();
              }
              
              final displayProducts = products.take(itemsToShow).toList();
              
              return layout == 'horizontal'
                  ? _buildHorizontalLayout(displayProducts)
                  : _buildGridLayout(displayProducts);
            },
            loading: () => _buildLoadingState(layout),
            error: (error, stack) => _buildErrorState(),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalLayout(List<Product> products) {
    return SizedBox(
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return Container(
            width: 200,
            margin: EdgeInsets.only(right: index < products.length - 1 ? 12 : 0),
            child: ProductCard(product: product),
          );
        },
      ),
    );
  }

  Widget _buildGridLayout(List<Product> products) {
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
        return ProductCard(product: product);
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
              Icons.shopping_bag_outlined,
              size: 48,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'No new arrivals available',
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
              'Failed to load new arrivals',
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
} 