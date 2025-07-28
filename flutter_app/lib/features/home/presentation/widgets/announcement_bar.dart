import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/live_rendering_service.dart';

class AnnouncementBar extends ConsumerWidget {
  const AnnouncementBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appConfig = ref.watch(appConfigProvider);
    final announcementConfig = appConfig['announcementBar'] as Map<String, dynamic>? ?? {};
    
    final isEnabled = announcementConfig['enabled'] as bool? ?? true;
    
    if (!isEnabled) {
      return const SizedBox.shrink();
    }
    
    final text = announcementConfig['text'] as String? ?? 'Welcome to our store!';
    final backgroundColor = announcementConfig['backgroundColor'] as String? ?? '#2563EB';
    final textColor = announcementConfig['textColor'] as String? ?? '#FFFFFF';
    final fontSize = (announcementConfig['fontSize'] as num?)?.toDouble() ?? 14.0;
    final isScrolling = announcementConfig['isScrolling'] as bool? ?? false;
    final height = (announcementConfig['height'] as num?)?.toDouble() ?? 40.0;

    return Container(
      height: height,
      width: double.infinity,
      color: _parseColor(backgroundColor),
      child: Center(
        child: isScrolling
            ? _buildScrollingText(text, textColor, fontSize)
            : _buildStaticText(text, textColor, fontSize),
      ),
    );
  }

  Widget _buildStaticText(String text, String textColor, double fontSize) {
    return Text(
      text,
      style: TextStyle(
        color: _parseColor(textColor),
        fontSize: fontSize,
        fontWeight: FontWeight.w500,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildScrollingText(String text, String textColor, double fontSize) {
    return SizedBox(
      height: 40,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (int i = 0; i < 3; i++) // Show text 3 times for continuous scroll
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  text,
                  style: TextStyle(
                    color: _parseColor(textColor),
                    fontSize: fontSize,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
          ],
        ),
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