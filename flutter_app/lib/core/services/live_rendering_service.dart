import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../config/app_config.dart';
import 'api_service.dart';

class LiveRenderingService {
  static WebSocketChannel? _channel;
  static StreamController<Map<String, dynamic>>? _configUpdatesController;
  static Timer? _reconnectTimer;
  static bool _isConnected = false;
  static int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 5);
  
  static Stream<Map<String, dynamic>> get configUpdates =>
      _configUpdatesController!.stream;
  
  static bool get isConnected => _isConnected;
  
  static Future<void> initialize() async {
    _configUpdatesController = StreamController<Map<String, dynamic>>.broadcast();
    
    if (AppConfig.isLiveRenderingEnabled) {
      await connect();
    }
  }
  
  static Future<void> connect() async {
    if (_channel != null) {
      await disconnect();
    }
    
    try {
      print('Connecting to WebSocket: ${AppConfig.websocketUrl}');
      
      _channel = WebSocketChannel.connect(
        Uri.parse(AppConfig.websocketUrl),
      );
      
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDisconnected,
      );
      
      // Send authentication message
      _channel!.sink.add(jsonEncode({
        'type': 'auth',
        'token': AppConfig.shopifyStorefrontToken,
      }));
      
      _isConnected = true;
      _reconnectAttempts = 0;
      _reconnectTimer?.cancel();
      
      print('WebSocket connected successfully');
    } catch (e) {
      print('Error connecting to WebSocket: $e');
      _scheduleReconnect();
    }
  }
  
  static Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    
    if (_channel != null) {
      await _channel!.sink.close(status.goingAway);
      _channel = null;
    }
    
    _isConnected = false;
  }
  
  static void _onMessage(dynamic message) {
    try {
      final Map<String, dynamic> data = jsonDecode(message);
      print('WebSocket message received: $data');
      
      switch (data['type']) {
        case 'config_update':
          _handleConfigUpdate(data['payload']);
          break;
        case 'auth_success':
          print('WebSocket authentication successful');
          break;
        case 'auth_error':
          print('WebSocket authentication failed: ${data['message']}');
          break;
        case 'ping':
          // Respond to ping with pong
          _channel?.sink.add(jsonEncode({'type': 'pong'}));
          break;
        default:
          print('Unknown message type: ${data['type']}');
      }
    } catch (e) {
      print('Error processing WebSocket message: $e');
    }
  }
  
  static void _onError(error) {
    print('WebSocket error: $error');
    _isConnected = false;
    _scheduleReconnect();
  }
  
  static void _onDisconnected() {
    print('WebSocket disconnected');
    _isConnected = false;
    _scheduleReconnect();
  }
  
  static void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      print('Max reconnection attempts reached. Giving up.');
      return;
    }
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _reconnectAttempts++;
      print('Attempting to reconnect... (attempt $_reconnectAttempts/$_maxReconnectAttempts)');
      connect();
    });
  }
  
  static void _handleConfigUpdate(Map<String, dynamic> config) {
    print('Received config update: $config');
    _configUpdatesController?.add(config);
  }
  
  static Future<Map<String, dynamic>> getCurrentConfig() async {
    try {
      return await ApiService.getAppConfig();
    } catch (e) {
      print('Error fetching current config: $e');
      return {};
    }
  }
  
  static void dispose() {
    _reconnectTimer?.cancel();
    _configUpdatesController?.close();
    disconnect();
  }
}

// Riverpod providers for live rendering
final liveRenderingServiceProvider = Provider<LiveRenderingService>((ref) {
  return LiveRenderingService();
});

final appConfigProvider = StateNotifierProvider<AppConfigNotifier, Map<String, dynamic>>((ref) {
  return AppConfigNotifier();
});

class AppConfigNotifier extends StateNotifier<Map<String, dynamic>> {
  AppConfigNotifier() : super({}) {
    _initialize();
  }
  
  Future<void> _initialize() async {
    // Load initial config
    final config = await LiveRenderingService.getCurrentConfig();
    state = config;
    
    // Listen for real-time updates
    LiveRenderingService.configUpdates.listen((updatedConfig) {
      state = {...state, ...updatedConfig};
    });
  }
  
  void updateConfig(Map<String, dynamic> newConfig) {
    state = {...state, ...newConfig};
  }
  
  T? getValue<T>(String key, [T? defaultValue]) {
    return state[key] as T? ?? defaultValue;
  }
  
  // Helper methods for specific config sections
  Map<String, dynamic> get announcementBarConfig => 
      state['announcementBar'] as Map<String, dynamic>? ?? {};
  
  Map<String, dynamic> get headerConfig => 
      state['header'] as Map<String, dynamic>? ?? {};
  
  List<dynamic> get sliderConfig => 
      state['slider'] as List<dynamic>? ?? [];
  
  Map<String, dynamic> get categoriesConfig => 
      state['categories'] as Map<String, dynamic>? ?? {};
  
  Map<String, dynamic> get newArrivalsConfig => 
      state['newArrivals'] as Map<String, dynamic>? ?? {};
  
  Map<String, dynamic> get bestSellerConfig => 
      state['bestSeller'] as Map<String, dynamic>? ?? {};
  
  Map<String, dynamic> get footerConfig => 
      state['footer'] as Map<String, dynamic>? ?? {};
  
  Map<String, dynamic> get bottomNavigationConfig => 
      state['bottomNavigation'] as Map<String, dynamic>? ?? {};
} 