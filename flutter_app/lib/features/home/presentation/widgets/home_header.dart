import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/live_rendering_service.dart';
import '../../../../core/routes/app_router.dart';

class HomeHeader extends ConsumerWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appConfig = ref.watch(appConfigProvider);
    final headerConfig = appConfig['header'] as Map<String, dynamic>? ?? {};
    
    final showLogo = headerConfig['showLogo'] as bool? ?? true;
    final logoUrl = headerConfig['logoUrl'] as String? ?? '';
    final title = headerConfig['title'] as String? ?? 'Eyejack';
    final backgroundColor = headerConfig['backgroundColor'] as String? ?? '#FFFFFF';
    final textColor = headerConfig['textColor'] as String? ?? '#1F2937';
    final showSearch = headerConfig['showSearch'] as bool? ?? true;
    final showCart = headerConfig['showCart'] as bool? ?? true;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 50, 16, 16),
      color: _parseColor(backgroundColor),
      child: Row(
        children: [
          // Logo/Title
          Expanded(
            child: Row(
              children: [
                if (showLogo && logoUrl.isNotEmpty)
                  Image.network(
                    logoUrl,
                    height: 32,
                    width: 32,
                    errorBuilder: (context, error, stackTrace) {
                      return _buildTitleText(title, textColor);
                    },
                  )
                else
                  _buildTitleText(title, textColor),
              ],
            ),
          ),
          
          // Action buttons
          Row(
            children: [
              if (showSearch)
                IconButton(
                  onPressed: () => context.go(AppRoutes.search),
                  icon: Icon(
                    Icons.search,
                    color: _parseColor(textColor),
                  ),
                ),
              
              if (showCart)
                IconButton(
                  onPressed: () => context.go(AppRoutes.cart),
                  icon: Stack(
                    children: [
                      Icon(
                        Icons.shopping_cart_outlined,
                        color: _parseColor(textColor),
                      ),
                      // Cart badge (you can implement cart count here)
                      // Positioned(
                      //   right: 0,
                      //   top: 0,
                      //   child: Container(
                      //     padding: const EdgeInsets.all(2),
                      //     decoration: BoxDecoration(
                      //       color: Theme.of(context).primaryColor,
                      //       borderRadius: BorderRadius.circular(10),
                      //     ),
                      //     constraints: const BoxConstraints(
                      //       minWidth: 16,
                      //       minHeight: 16,
                      //     ),
                      //     child: Text(
                      //       '2', // Cart count
                      //       style: const TextStyle(
                      //         color: Colors.white,
                      //         fontSize: 10,
                      //         fontWeight: FontWeight.bold,
                      //       ),
                      //       textAlign: TextAlign.center,
                      //     ),
                      //   ),
                      // ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTitleText(String title, String textColor) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: _parseColor(textColor),
      ),
    );
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
} 