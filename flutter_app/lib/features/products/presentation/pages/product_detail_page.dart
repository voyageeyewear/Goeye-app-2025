import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/models/product.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/providers/cart_provider.dart';

// Provider for fetching individual product data
final productDetailProvider = FutureProvider.family<Product?, String>((ref, handle) async {
  try {
    return await ApiService.getProduct(handle);
  } catch (e) {
    print('Error fetching product detail: $e');
    return null;
  }
});

class ProductDetailPage extends ConsumerWidget {
  final String productHandle;

  const ProductDetailPage({
    super.key,
    required this.productHandle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productAsync = ref.watch(productDetailProvider(productHandle));

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Product Details',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border, color: Colors.black),
            onPressed: () {
              // TODO: Implement wishlist functionality
            },
          ),
          IconButton(
            icon: const Icon(Icons.share, color: Colors.black),
            onPressed: () {
              // TODO: Implement share functionality
            },
          ),
        ],
      ),
      body: productAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                'Error loading product',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Please try again later',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => ref.refresh(productDetailProvider(productHandle)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (product) {
          if (product == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.search_off, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'Product not found',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'The product you\'re looking for doesn\'t exist',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }

          return _ProductDetailContent(product: product);
        },
      ),
    );
  }
}

class _ProductDetailContent extends StatefulWidget {
  final Product product;

  const _ProductDetailContent({required this.product});

  @override
  State<_ProductDetailContent> createState() => _ProductDetailContentState();
}

class _ProductDetailContentState extends State<_ProductDetailContent> {
  int selectedImageIndex = 0;
  int selectedVariantIndex = 0;
  int quantity = 1;

  @override
  Widget build(BuildContext context) {
    final selectedVariant = widget.product.variants.isNotEmpty 
        ? widget.product.variants[selectedVariantIndex]
        : widget.product.defaultVariant;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Images
                _buildImageSection(),
                
                // Product Info
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and Vendor
                      _buildTitleSection(),
                      
                      const SizedBox(height: 16),
                      
                      // Price Section
                      _buildPriceSection(selectedVariant),
                      
                      const SizedBox(height: 20),
                      
                      // Variant Selection
                      if (widget.product.variants.length > 1)
                        _buildVariantSelection(),
                      
                      const SizedBox(height: 20),
                      
                      // Quantity Selector
                      _buildQuantitySelector(),
                      
                      const SizedBox(height: 24),
                      
                      // Description
                      _buildDescriptionSection(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Add to Cart Button
        _buildAddToCartSection(selectedVariant),
      ],
    );
  }

  Widget _buildImageSection() {
    return Container(
      height: 400,
      color: Colors.white,
      child: widget.product.images.isEmpty
          ? const Center(
              child: Icon(Icons.image_not_supported, size: 64, color: Colors.grey),
            )
          : Column(
              children: [
                // Main Image
                Expanded(
                  child: PageView.builder(
                    itemCount: widget.product.images.length,
                    onPageChanged: (index) {
                      setState(() {
                        selectedImageIndex = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      return CachedNetworkImage(
                        imageUrl: widget.product.images[index].url,
                        fit: BoxFit.contain,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(),
                        ),
                        errorWidget: (context, url, error) => const Center(
                          child: Icon(Icons.image_not_supported),
                        ),
                      );
                    },
                  ),
                ),
                
                // Image Indicators
                if (widget.product.images.length > 1)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        widget.product.images.length,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: selectedImageIndex == index
                                ? Theme.of(context).primaryColor
                                : Colors.grey[300],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.product.title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        if (widget.product.vendor.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            widget.product.vendor,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPriceSection(ProductVariant selectedVariant) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        // Current Price - Bold and prominent
        Text(
          selectedVariant.formattedPrice,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        
        // Compare At Price - Subtle gray with strikethrough
        if (selectedVariant.formattedCompareAtPrice != null) ...[
          const SizedBox(width: 12),
          Text(
            selectedVariant.formattedCompareAtPrice!,
            style: TextStyle(
              fontSize: 20,
              color: Colors.grey[400],
              decoration: TextDecoration.lineThrough,
              decorationColor: Colors.grey[400],
              decorationThickness: 2,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildVariantSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Options:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            widget.product.variants.length,
            (index) {
              final variant = widget.product.variants[index];
              final isSelected = selectedVariantIndex == index;
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    selectedVariantIndex = index;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected 
                          ? Theme.of(context).primaryColor 
                          : Colors.grey[300]!,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(8),
                    color: isSelected 
                        ? Theme.of(context).primaryColor.withOpacity(0.1)
                        : Colors.white,
                  ),
                  child: Text(
                    variant.title,
                    style: TextStyle(
                      color: isSelected 
                          ? Theme.of(context).primaryColor 
                          : Colors.black,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildQuantitySelector() {
    return Row(
      children: [
        const Text(
          'Quantity:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 16),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: quantity > 1 
                    ? () => setState(() => quantity--) 
                    : null,
                icon: const Icon(Icons.remove),
                iconSize: 20,
              ),
              Container(
                width: 40,
                alignment: Alignment.center,
                child: Text(
                  quantity.toString(),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => setState(() => quantity++),
                icon: const Icon(Icons.add),
                iconSize: 20,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDescriptionSection() {
    if (widget.product.description.isEmpty) return const SizedBox.shrink();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Description',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          widget.product.description,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[700],
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildAddToCartSection(ProductVariant selectedVariant) {
    return Consumer(
      builder: (context, ref, child) {
        final cartState = ref.watch(cartProvider);
        final cartNotifier = ref.read(cartProvider.notifier);
        final isLoading = cartState.isLoading;
        
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Availability Status
              Row(
                children: [
                  Icon(
                    selectedVariant.availableForSale 
                        ? Icons.check_circle 
                        : Icons.cancel,
                    color: selectedVariant.availableForSale 
                        ? Colors.green 
                        : Colors.red,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    selectedVariant.availableForSale 
                        ? 'In Stock' 
                        : 'Out of Stock',
                    style: TextStyle(
                      color: selectedVariant.availableForSale 
                          ? Colors.green 
                          : Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (selectedVariant.quantityAvailable != null)
                    Text(
                      ' (${selectedVariant.quantityAvailable} available)',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Add to Cart Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: selectedVariant.availableForSale && !isLoading
                      ? () async {
                          try {
                            // Add to cart using the cart provider
                            await cartNotifier.addToCart(
                              selectedVariant.id, 
                              quantity,
                            );
                            
                            // Show success message
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Added $quantity ${widget.product.title} to cart!',
                                  ),
                                  backgroundColor: Colors.green,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            }
                          } catch (e) {
                            // Show error message
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Failed to add to cart: ${e.toString()}',
                                  ),
                                  backgroundColor: Colors.red,
                                  duration: const Duration(seconds: 3),
                                ),
                              );
                            }
                          }
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          selectedVariant.availableForSale
                              ? 'Add to Cart - ${selectedVariant.formattedPrice}'
                              : 'Out of Stock',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
} 