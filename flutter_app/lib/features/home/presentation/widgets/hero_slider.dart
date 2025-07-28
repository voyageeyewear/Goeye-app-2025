import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/live_rendering_service.dart';
import '../../../../core/routes/app_router.dart';

class HeroSlider extends ConsumerStatefulWidget {
  const HeroSlider({super.key});

  @override
  ConsumerState<HeroSlider> createState() => _HeroSliderState();
}

class _HeroSliderState extends ConsumerState<HeroSlider> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final appConfig = ref.watch(appConfigProvider);
    final sliderConfig = appConfig['slider'] as List<dynamic>? ?? [];

    if (sliderConfig.isEmpty) {
      return _buildDefaultSlider();
    }

    final slides = sliderConfig.map((slide) => slide as Map<String, dynamic>).toList();
    final autoPlay = appConfig['sliderAutoPlay'] as bool? ?? true;
    final autoPlayInterval = (appConfig['sliderAutoPlayInterval'] as num?)?.toInt() ?? 3;
    final showIndicators = appConfig['sliderShowIndicators'] as bool? ?? true;
    final height = (appConfig['sliderHeight'] as num?)?.toDouble() ?? 200.0;

    return Column(
      children: [
        CarouselSlider.builder(
          itemCount: slides.length,
          itemBuilder: (context, index, realIndex) {
            final slide = slides[index];
            return _buildSlideItem(slide);
          },
          options: CarouselOptions(
            height: height,
            viewportFraction: 1.0,
            autoPlay: autoPlay,
            autoPlayInterval: Duration(seconds: autoPlayInterval),
            onPageChanged: (index, reason) {
              setState(() {
                _currentIndex = index;
              });
            },
          ),
        ),
        
        if (showIndicators && slides.length > 1)
          _buildIndicators(slides.length),
      ],
    );
  }

  Widget _buildSlideItem(Map<String, dynamic> slide) {
    final imageUrl = slide['imageUrl'] as String? ?? '';
    final title = slide['title'] as String? ?? '';
    final subtitle = slide['subtitle'] as String? ?? '';
    final buttonText = slide['buttonText'] as String? ?? '';
    final buttonAction = slide['buttonAction'] as String? ?? '';
    final textOverlay = slide['textOverlay'] as bool? ?? true;
    final textColor = slide['textColor'] as String? ?? '#FFFFFF';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background Image
            if (imageUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: Colors.grey[300],
                  child: const Center(
                    child: CircularProgressIndicator(),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: Colors.grey[300],
                  child: const Center(
                    child: Icon(Icons.image_not_supported),
                  ),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).primaryColor,
                      Theme.of(context).primaryColor.withOpacity(0.7),
                    ],
                  ),
                ),
              ),
            
            // Text Overlay
            if (textOverlay && (title.isNotEmpty || subtitle.isNotEmpty))
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.6),
                    ],
                  ),
                ),
              ),
            
            // Content
            if (textOverlay)
              Positioned(
                bottom: 24,
                left: 24,
                right: 24,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (title.isNotEmpty)
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: _parseColor(textColor),
                        ),
                      ),
                    
                    if (subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 16,
                            color: _parseColor(textColor).withOpacity(0.9),
                          ),
                        ),
                      ),
                    
                    if (buttonText.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: ElevatedButton(
                          onPressed: () => _handleButtonAction(buttonAction),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Theme.of(context).primaryColor,
                            foregroundColor: Colors.white,
                          ),
                          child: Text(buttonText),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIndicators(int count) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(count, (index) {
          return Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _currentIndex == index
                  ? Theme.of(context).primaryColor
                  : Colors.grey[300],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildDefaultSlider() {
    return Container(
      height: 200,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.7),
          ],
        ),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Welcome to Eyejack',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Discover amazing products',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleButtonAction(String action) {
    if (action.isEmpty) return;

    if (action.startsWith('/')) {
      context.go(action);
    } else if (action.startsWith('collection:')) {
      final collectionHandle = action.replaceFirst('collection:', '');
      context.go(AppRoutes.collectionDetailPath(collectionHandle));
    } else if (action.startsWith('product:')) {
      final productHandle = action.replaceFirst('product:', '');
      context.go(AppRoutes.productDetailPath(productHandle));
    }
  }

  Color _parseColor(String colorString) {
    try {
      if (colorString.startsWith('#')) {
        return Color(int.parse(colorString.substring(1), radix: 16) + 0xFF000000);
      }
      return Colors.white; // fallback
    } catch (e) {
      return Colors.white; // fallback
    }
  }
} 