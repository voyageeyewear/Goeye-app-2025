import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/live_rendering_service.dart';
import '../../../core/routes/app_router.dart';

class MainWrapper extends ConsumerStatefulWidget {
  final Widget child;
  
  const MainWrapper({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<MainWrapper> createState() => _MainWrapperState();
}

class _MainWrapperState extends ConsumerState<MainWrapper> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final appConfig = ref.watch(appConfigProvider);
    final bottomNavConfig = appConfig['bottomNavigation'] as Map<String, dynamic>? ?? {};
    
    // Get current route to determine active tab
    final currentRoute = GoRouterState.of(context).uri.path;
    _currentIndex = _getIndexFromRoute(currentRoute);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: _buildBottomNavigation(bottomNavConfig),
    );
  }

  int _getIndexFromRoute(String route) {
    switch (route) {
      case '/':
        return 0;
      case '/search':
        return 1;
      case '/cart':
        return 2;
      case '/profile':
        return 3;
      default:
        return 0;
    }
  }

  Widget _buildBottomNavigation(Map<String, dynamic> config) {
    final isEnabled = config['enabled'] as bool? ?? true;
    
    if (!isEnabled) {
      return const SizedBox.shrink();
    }

    final items = _getBottomNavItems(config);
    final backgroundColor = config['backgroundColor'] as String? ?? '#FFFFFF';
    final selectedColor = config['selectedColor'] as String? ?? '#2563EB';
    final unselectedColor = config['unselectedColor'] as String? ?? '#6B7280';

    return Container(
      decoration: BoxDecoration(
        color: _parseColor(backgroundColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: _parseColor(backgroundColor),
        selectedItemColor: _parseColor(selectedColor),
        unselectedItemColor: _parseColor(unselectedColor),
        elevation: 0,
        items: items,
      ),
    );
  }

  List<BottomNavigationBarItem> _getBottomNavItems(Map<String, dynamic> config) {
    final customItems = config['items'] as List<dynamic>? ?? [];
    
    if (customItems.isNotEmpty) {
      return customItems.map((item) {
        final itemMap = item as Map<String, dynamic>;
        return BottomNavigationBarItem(
          icon: Icon(_parseIconData(itemMap['icon'] as String? ?? 'home')),
          label: itemMap['label'] as String? ?? 'Home',
        );
      }).toList();
    }

    // Default navigation items
    return const [
      BottomNavigationBarItem(
        icon: Icon(Icons.home),
        label: 'Home',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.search),
        label: 'Search',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.shopping_cart),
        label: 'Cart',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.person),
        label: 'Profile',
      ),
    ];
  }

  void _onTabTapped(int index) {
    switch (index) {
      case 0:
        context.go(AppRoutes.home);
        break;
      case 1:
        context.go(AppRoutes.search);
        break;
      case 2:
        context.go(AppRoutes.cart);
        break;
      case 3:
        context.go(AppRoutes.profile);
        break;
    }
  }

  Color _parseColor(String colorString) {
    try {
      if (colorString.startsWith('#')) {
        return Color(int.parse(colorString.substring(1), radix: 16) + 0xFF000000);
      }
      return Colors.blue; // fallback
    } catch (e) {
      return Colors.blue; // fallback
    }
  }

  IconData _parseIconData(String iconName) {
    switch (iconName.toLowerCase()) {
      case 'home':
        return Icons.home;
      case 'search':
        return Icons.search;
      case 'cart':
      case 'shopping_cart':
        return Icons.shopping_cart;
      case 'profile':
      case 'person':
        return Icons.person;
      case 'favorite':
      case 'heart':
        return Icons.favorite;
      case 'category':
      case 'grid':
        return Icons.grid_view;
      default:
        return Icons.home;
    }
  }
} 