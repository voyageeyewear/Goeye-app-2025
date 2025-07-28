import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/live_rendering_service.dart';
import '../widgets/announcement_bar.dart';
import '../widgets/home_header.dart';
import '../widgets/hero_slider.dart';
import '../widgets/shop_by_category.dart';
import '../widgets/new_arrivals_section.dart';
import '../widgets/best_seller_section.dart';
import '../widgets/home_footer.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appConfig = ref.watch(appConfigProvider);
    
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh the app configuration and data
          ref.invalidate(appConfigProvider);
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Announcement Bar
            if (_shouldShowSection(appConfig['announcementBar']))
              const SliverToBoxAdapter(
                child: AnnouncementBar(),
              ),
            
            // Header with search and cart
            const SliverToBoxAdapter(
              child: HomeHeader(),
            ),
            
            // Hero Slider
            if (_shouldShowSection(appConfig['slider']))
              const SliverToBoxAdapter(
                child: HeroSlider(),
              ),
            
            // Shop by Category
            if (_shouldShowSection(appConfig['categories']))
              const SliverToBoxAdapter(
                child: ShopByCategory(),
              ),
            
            // New Arrivals
            if (_shouldShowSection(appConfig['newArrivals']))
              const SliverToBoxAdapter(
                child: NewArrivalsSection(),
              ),
            
            // Best Seller
            if (_shouldShowSection(appConfig['bestSeller']))
              const SliverToBoxAdapter(
                child: BestSellerSection(),
              ),
            
            // Footer
            if (_shouldShowSection(appConfig['footer']))
              const SliverToBoxAdapter(
                child: HomeFooter(),
              ),
            
            // Add some bottom padding for the bottom navigation
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }

  bool _shouldShowSection(dynamic sectionConfig) {
    if (sectionConfig == null) return true;
    if (sectionConfig is Map<String, dynamic>) {
      return sectionConfig['enabled'] as bool? ?? true;
    }
    return true;
  }
} 