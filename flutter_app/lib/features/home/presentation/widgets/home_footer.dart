import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/live_rendering_service.dart';

class HomeFooter extends ConsumerWidget {
  const HomeFooter({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appConfig = ref.watch(appConfigProvider);
    final footerConfig = appConfig['footer'] as Map<String, dynamic>? ?? {};
    
    final isEnabled = footerConfig['enabled'] as bool? ?? true;
    
    if (!isEnabled) {
      return const SizedBox.shrink();
    }
    
    final backgroundColor = footerConfig['backgroundColor'] as String? ?? '#1F2937';
    final textColor = footerConfig['textColor'] as String? ?? '#FFFFFF';
    final companyName = footerConfig['companyName'] as String? ?? 'Eyejack';
    final description = footerConfig['description'] as String? ?? 'Your premier shopping destination';
    final showSocialLinks = footerConfig['showSocialLinks'] as bool? ?? true;
    final showQuickLinks = footerConfig['showQuickLinks'] as bool? ?? true;
    final showContactInfo = footerConfig['showContactInfo'] as bool? ?? true;
    final socialLinks = footerConfig['socialLinks'] as List<dynamic>? ?? [];
    final quickLinks = footerConfig['quickLinks'] as List<dynamic>? ?? [];
    final contactInfo = footerConfig['contactInfo'] as Map<String, dynamic>? ?? {};

    return Container(
      padding: const EdgeInsets.all(24),
      color: _parseColor(backgroundColor),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Company Info
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                companyName,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: _parseColor(textColor),
                ),
              ),
              if (description.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      color: _parseColor(textColor).withOpacity(0.8),
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Footer Content
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Quick Links
              if (showQuickLinks)
                Expanded(
                  child: _buildQuickLinks(quickLinks, textColor),
                ),
              
              // Contact Info
              if (showContactInfo)
                Expanded(
                  child: _buildContactInfo(contactInfo, textColor),
                ),
            ],
          ),
          
          // Social Links
          if (showSocialLinks && socialLinks.isNotEmpty)
            Column(
              children: [
                const SizedBox(height: 24),
                _buildSocialLinks(socialLinks, textColor),
              ],
            ),
          
          // Divider
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Divider(
              color: _parseColor(textColor).withOpacity(0.3),
            ),
          ),
          
          // Copyright
          Center(
            child: Text(
              '© ${DateTime.now().year} $companyName. All rights reserved.',
              style: TextStyle(
                fontSize: 12,
                color: _parseColor(textColor).withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickLinks(List<dynamic> links, String textColor) {
    if (links.isEmpty) {
      return _buildDefaultQuickLinks(textColor);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Links',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _parseColor(textColor),
          ),
        ),
        const SizedBox(height: 12),
        ...links.map((link) {
          final linkMap = link as Map<String, dynamic>;
          final title = linkMap['title'] as String? ?? '';
          final url = linkMap['url'] as String? ?? '';
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => _launchUrl(url),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  color: _parseColor(textColor).withOpacity(0.8),
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildDefaultQuickLinks(String textColor) {
    final defaultLinks = [
      {'title': 'About Us', 'url': '/about'},
      {'title': 'Contact', 'url': '/contact'},
      {'title': 'Privacy Policy', 'url': '/privacy'},
      {'title': 'Terms of Service', 'url': '/terms'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Links',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _parseColor(textColor),
          ),
        ),
        const SizedBox(height: 12),
        ...defaultLinks.map((link) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => _launchUrl(link['url']!),
              child: Text(
                link['title']!,
                style: TextStyle(
                  fontSize: 14,
                  color: _parseColor(textColor).withOpacity(0.8),
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildContactInfo(Map<String, dynamic> contactInfo, String textColor) {
    final email = contactInfo['email'] as String? ?? 'contact@eyejack.com';
    final phone = contactInfo['phone'] as String? ?? '+1 (555) 123-4567';
    final address = contactInfo['address'] as String? ?? '123 Main St, City, State 12345';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact Us',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _parseColor(textColor),
          ),
        ),
        const SizedBox(height: 12),
        
        if (email.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Icon(
                  Icons.email,
                  size: 16,
                  color: _parseColor(textColor).withOpacity(0.8),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _launchUrl('mailto:$email'),
                    child: Text(
                      email,
                      style: TextStyle(
                        fontSize: 14,
                        color: _parseColor(textColor).withOpacity(0.8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        
        if (phone.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Icon(
                  Icons.phone,
                  size: 16,
                  color: _parseColor(textColor).withOpacity(0.8),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _launchUrl('tel:$phone'),
                    child: Text(
                      phone,
                      style: TextStyle(
                        fontSize: 14,
                        color: _parseColor(textColor).withOpacity(0.8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        
        if (address.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.location_on,
                  size: 16,
                  color: _parseColor(textColor).withOpacity(0.8),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    address,
                    style: TextStyle(
                      fontSize: 14,
                      color: _parseColor(textColor).withOpacity(0.8),
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSocialLinks(List<dynamic> socialLinks, String textColor) {
    return Column(
      children: [
        Text(
          'Follow Us',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _parseColor(textColor),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: socialLinks.map((link) {
            final linkMap = link as Map<String, dynamic>;
            final platform = linkMap['platform'] as String? ?? '';
            final url = linkMap['url'] as String? ?? '';
            
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: GestureDetector(
                onTap: () => _launchUrl(url),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _parseColor(textColor).withOpacity(0.3),
                    ),
                  ),
                  child: Icon(
                    _getSocialIcon(platform),
                    size: 20,
                    color: _parseColor(textColor).withOpacity(0.8),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  IconData _getSocialIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return Icons.facebook;
      case 'twitter':
        return Icons.close; // Twitter X icon not available in default icons
      case 'instagram':
        return Icons.camera_alt; // Instagram icon approximation
      case 'linkedin':
        return Icons.business;
      case 'youtube':
        return Icons.play_circle_outline;
      default:
        return Icons.link;
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

  void _launchUrl(String url) async {
    if (url.isEmpty) return;
    
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (e) {
      print('Error launching URL: $e');
    }
  }
} 