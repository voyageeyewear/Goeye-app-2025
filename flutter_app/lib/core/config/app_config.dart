import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static late SharedPreferences _prefs;
  
  // Shopify Configuration
  static const String _shopifyBaseUrl = 'SHOPIFY_BASE_URL';
  static const String _shopifyStorefrontToken = 'SHOPIFY_STOREFRONT_TOKEN';
  static const String _backendApiUrl = 'BACKEND_API_URL';
  
  // Live Rendering Configuration
  static const String _liveRenderingEnabled = 'LIVE_RENDERING_ENABLED';
  static const String _websocketUrl = 'WEBSOCKET_URL';
  
  // Default values
  static const String defaultBackendUrl = 'https://your-app-url.ngrok.io';
  static const String defaultWebsocketUrl = 'wss://your-app-url.ngrok.io/ws';
  
  static Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // Shopify Configuration Getters
  static String get shopifyBaseUrl => 
      _prefs.getString(_shopifyBaseUrl) ?? '';
  
  static String get shopifyStorefrontToken => 
      _prefs.getString(_shopifyStorefrontToken) ?? '';
  
  static String get backendApiUrl => 
      _prefs.getString(_backendApiUrl) ?? defaultBackendUrl;
  
  static String get websocketUrl => 
      _prefs.getString(_websocketUrl) ?? defaultWebsocketUrl;
  
  static bool get isLiveRenderingEnabled => 
      _prefs.getBool(_liveRenderingEnabled) ?? true;
  
  // Shopify Configuration Setters
  static Future<void> setShopifyBaseUrl(String url) async {
    await _prefs.setString(_shopifyBaseUrl, url);
  }
  
  static Future<void> setShopifyStorefrontToken(String token) async {
    await _prefs.setString(_shopifyStorefrontToken, token);
  }
  
  static Future<void> setBackendApiUrl(String url) async {
    await _prefs.setString(_backendApiUrl, url);
  }
  
  static Future<void> setWebsocketUrl(String url) async {
    await _prefs.setString(_websocketUrl, url);
  }
  
  static Future<void> setLiveRenderingEnabled(bool enabled) async {
    await _prefs.setBool(_liveRenderingEnabled, enabled);
  }
  
  // Helper methods
  static bool get isConfigured => 
      shopifyBaseUrl.isNotEmpty && shopifyStorefrontToken.isNotEmpty;
  
  static Map<String, dynamic> get allConfig => {
    'shopifyBaseUrl': shopifyBaseUrl,
    'shopifyStorefrontToken': shopifyStorefrontToken,
    'backendApiUrl': backendApiUrl,
    'websocketUrl': websocketUrl,
    'isLiveRenderingEnabled': isLiveRenderingEnabled,
  };
} 