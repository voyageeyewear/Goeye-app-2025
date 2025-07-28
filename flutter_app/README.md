# Eyejack Mobile App

A Flutter mobile application with live Shopify integration and real-time rendering capabilities.

## Features

### 🎨 Live Rendering System
- Real-time configuration updates without app rebuilds
- WebSocket-based live updates from Shopify admin
- Comprehensive UI customization options

### 🛍️ Shopify Integration
- Product browsing and search
- Collection management
- Shopping cart functionality
- Secure checkout process
- Real-time inventory updates

### 📱 Mobile-First Design
- Modern, responsive UI components
- Dark/Light theme support
- Smooth animations and transitions
- Optimized for iOS and Android

### 🔧 Configurable Sections
- **Announcement Bar**: Customizable promotional messages
- **Header**: Logo, title, search, and cart icons
- **Hero Slider**: Dynamic image carousels with CTAs
- **Categories**: Grid or horizontal category display
- **New Arrivals**: Latest product showcases
- **Best Sellers**: Popular product highlights
- **Footer**: Contact info, links, and social media
- **Bottom Navigation**: Customizable tab bar

## Architecture

### State Management
- **Riverpod**: For reactive state management
- **Provider Pattern**: For dependency injection
- **Real-time Updates**: WebSocket integration for live config changes

### Data Layer
- **API Service**: RESTful and GraphQL Shopify integration
- **Models**: Strongly-typed data models with JSON serialization
- **Caching**: Local storage with Hive for offline support

### UI Components
- **Modular Widgets**: Reusable, configurable components
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Custom Theming**: Dynamic color and typography systems

## Configuration

### Environment Setup
1. Update `AppConfig` with your Shopify store details:
```dart
static const String defaultBackendUrl = 'https://your-app-url.ngrok.io';
static const String defaultWebsocketUrl = 'wss://your-app-url.ngrok.io/ws';
```

2. Configure Shopify credentials in your backend `.env` file

### Live Rendering Configuration
Access the Shopify admin dashboard at `/admin/live-rendering` to:
- Configure app appearance and behavior
- Update content and messaging
- Manage product showcases
- Customize navigation and layout

## Development

### Prerequisites
- Flutter SDK (>=3.10.0)
- Dart SDK (>=3.0.0)
- iOS development: Xcode and CocoaPods
- Android development: Android Studio

### Installation
```bash
# Get dependencies
flutter pub get

# Generate code (models, routes)
flutter packages pub run build_runner build

# Run the app
flutter run
```

### Code Generation
The app uses code generation for:
- JSON serialization (`json_serializable`)
- Model classes (`build_runner`)

Run this command when adding new models:
```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

## Project Structure

```
lib/
├── core/                    # Core utilities and configuration
│   ├── config/             # App configuration
│   ├── models/             # Data models
│   ├── routes/             # Navigation and routing
│   ├── services/           # API and business logic services
│   └── theme/              # UI theming
├── features/               # Feature-based modules
│   ├── home/               # Home page and widgets
│   ├── products/           # Product listing and details
│   ├── collections/        # Collection browsing
│   ├── cart/               # Shopping cart
│   ├── search/             # Product search
│   └── profile/            # User profile
└── shared/                 # Shared UI components
    └── presentation/
        ├── pages/          # Common pages
        └── widgets/        # Reusable widgets
```

## Backend Integration

### Required API Endpoints
- `GET /api/app-config` - Fetch app configuration
- `POST /api/app-config` - Update app configuration
- `POST /api/cart` - Create shopping cart
- `GET /api/cart/:id` - Get cart details
- `POST /api/cart/:id/add` - Add items to cart
- `POST /api/checkout/create` - Create checkout session

### WebSocket Events
- `config_update` - Real-time configuration updates
- `auth_success/auth_error` - Authentication status
- `ping/pong` - Connection heartbeat

## Deployment

### Building for Production
```bash
# iOS
flutter build ios --release

# Android
flutter build apk --release
# or
flutter build appbundle --release
```

### Environment Configuration
Update the following for production:
1. Backend API URLs in `AppConfig`
2. Shopify store credentials
3. WebSocket server endpoints
4. SSL certificates for secure connections

## Contributing

1. Follow the established architecture patterns
2. Add proper error handling and loading states
3. Write unit tests for business logic
4. Update this README for new features
5. Use conventional commit messages

## License

© 2024 Eyejack. All rights reserved. 