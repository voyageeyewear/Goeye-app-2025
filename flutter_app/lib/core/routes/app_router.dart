import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/home/presentation/pages/home_page.dart';
import '../../features/products/presentation/pages/product_detail_page.dart';
import '../../features/products/presentation/pages/products_page.dart';
import '../../features/collections/presentation/pages/collection_detail_page.dart';
import '../../features/cart/presentation/pages/cart_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/search/presentation/pages/search_page.dart';
import '../../shared/presentation/pages/main_wrapper.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return MainWrapper(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            name: 'home',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/search',
            name: 'search',
            builder: (context, state) => const SearchPage(),
          ),
          GoRoute(
            path: '/cart',
            name: 'cart',
            builder: (context, state) => const CartPage(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
      GoRoute(
        path: '/products',
        name: 'products',
        builder: (context, state) {
          final collection = state.uri.queryParameters['collection'];
          final sortBy = state.uri.queryParameters['sortBy'];
          return ProductsPage(
            collectionHandle: collection,
            sortBy: sortBy,
          );
        },
      ),
      GoRoute(
        path: '/products/:handle',
        name: 'product-detail',
        builder: (context, state) {
          final handle = state.pathParameters['handle']!;
          return ProductDetailPage(productHandle: handle);
        },
      ),
      GoRoute(
        path: '/collections/:handle',
        name: 'collection-detail',
        builder: (context, state) {
          final handle = state.pathParameters['handle']!;
          return CollectionDetailPage(collectionHandle: handle);
        },
      ),
    ],
  );
});

class AppRoutes {
  static const String home = '/';
  static const String search = '/search';
  static const String cart = '/cart';
  static const String profile = '/profile';
  static const String products = '/products';
  static const String productDetail = '/products';
  static const String collectionDetail = '/collections';
  
  // Helper methods for navigation
  static String productDetailPath(String handle) => '/products/$handle';
  static String collectionDetailPath(String handle) => '/collections/$handle';
  static String productsWithCollection(String collection) => '/products?collection=$collection';
  static String productsWithSort(String sortBy) => '/products?sortBy=$sortBy';
} 