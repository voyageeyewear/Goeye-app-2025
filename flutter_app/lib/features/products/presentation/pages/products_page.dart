import 'package:flutter/material.dart';

class ProductsPage extends StatelessWidget {
  final String? collectionHandle;
  final String? sortBy;

  const ProductsPage({
    super.key,
    this.collectionHandle,
    this.sortBy,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(collectionHandle != null ? 'Collection' : 'Products'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.grid_view,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              collectionHandle != null 
                  ? 'Collection: $collectionHandle'
                  : sortBy != null 
                      ? 'Products sorted by: $sortBy'
                      : 'All Products',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Products page functionality coming soon!',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
} 