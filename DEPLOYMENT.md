# 🚀 Deployment Guide - Eyejack Mobile App with Live Rendering

This guide will help you deploy the complete Eyejack mobile app system with Shopify integration and live rendering capabilities.

## 📋 Prerequisites

### Development Environment
- **Node.js**: v18.20+ or v20.10+ or v21.0+
- **Flutter SDK**: v3.10.0+
- **Shopify CLI**: Latest version
- **ngrok**: For local development tunneling

### Shopify Requirements
- Shopify Partner Account
- Development store or Shopify Plus sandbox

## 🛠️ Backend Setup (Shopify App)

### 1. Environment Configuration

Create `.env` file in the root directory:
```bash
cp .env.example .env
```

Update the `.env` file with your credentials:
```bash
SHOPIFY_API_KEY=your_api_key_from_shopify_partners
SHOPIFY_API_SECRET=your_api_secret_from_shopify_partners
SCOPES=read_products,write_products,read_collections,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory,read_cart_transforms,write_cart_transforms
SHOPIFY_APP_URL=https://your-app-url.ngrok.io
DATABASE_URL="file:./dev.db"
WEBSOCKET_PORT=8080
NODE_ENV=development
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Generate Prisma client and push schema
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
# This will start both the Remix app and WebSocket server
npm run dev

# Or start them separately:
npm run dev:remix  # Remix app on port 3000
npm run dev:ws     # WebSocket server on port 8080
```

### 5. Shopify App Configuration

Update `shopify.app.toml` with your app details:
```toml
client_id = "your_client_id"
name = "your-app-name"
application_url = "https://your-domain.com/"
```

### 6. Connect to Shopify
```bash
shopify app dev
```

This will:
- Create a tunnel to your local development server
- Install the app in your development store
- Provide the app URL for testing

## 📱 Flutter App Setup

### 1. Navigate to Flutter Directory
```bash
cd flutter_app
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Generate Code (JSON serialization)
```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

### 4. Update Configuration

Edit `flutter_app/lib/core/config/app_config.dart`:
```dart
// Update these with your actual URLs
static const String defaultBackendUrl = 'https://your-app-url.ngrok.io';
static const String defaultWebsocketUrl = 'wss://your-app-url.ngrok.io';
```

### 5. Run Flutter App
```bash
# iOS Simulator
flutter run -d "iPhone 15 Pro"

# Android Emulator
flutter run -d "Android SDK built for arm64"

# Physical Device
flutter run
```

## 🎛️ Admin Dashboard Access

### 1. Access the Dashboard
Navigate to: `https://your-app-url.ngrok.io/admin/live-rendering`

### 2. Configure Your App
- **Announcement Bar**: Set promotional messages
- **Header**: Configure logo, title, colors
- **Hero Slider**: Add images, text, and call-to-action buttons
- **Categories**: Customize layout and appearance
- **Product Sections**: Configure New Arrivals and Best Sellers
- **Footer**: Set contact info and social links
- **Navigation**: Customize bottom navigation

### 3. Test Live Updates
- Make changes in the admin dashboard
- Save configuration
- Watch the Flutter app update in real-time!

## 🔄 Live Rendering System

### How It Works
1. **Admin Dashboard**: Make configuration changes
2. **API**: Saves config to database
3. **WebSocket**: Broadcasts changes to connected apps
4. **Flutter App**: Receives updates and refreshes UI instantly

### WebSocket Connection
- **Port**: 8080 (configurable via WEBSOCKET_PORT)
- **Authentication**: Uses Shopify storefront access token
- **Heartbeat**: Ping/pong every 30 seconds
- **Reconnection**: Automatic with exponential backoff

## 📊 API Endpoints

### Configuration
- `GET /api/app-config` - Fetch app configuration
- `POST /api/app-config` - Update app configuration

### Shopping Cart
- `POST /api/cart` - Create new cart
- `GET /api/cart/:id` - Get cart details
- `POST /api/cart/:id/add` - Add items to cart
- `PUT /api/cart/:id/update` - Update cart items
- `DELETE /api/cart/:id/remove/:lineId` - Remove cart items

### Checkout
- `POST /api/checkout/create` - Create checkout session

## 🏭 Production Deployment

### Backend (Shopify App)

#### Option 1: Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SHOPIFY_APP_URL=https://your-app-name.herokuapp.com

# Deploy
git push heroku main
```

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Option 3: Railway
```bash
# Install Railway CLI
# Connect to Railway
railway login
railway init
railway up
```

### Flutter App

#### iOS App Store
```bash
# Build for iOS
flutter build ios --release

# Open in Xcode and submit to App Store Connect
open ios/Runner.xcworkspace
```

#### Google Play Store
```bash
# Build App Bundle
flutter build appbundle --release

# Upload to Google Play Console
# File location: build/app/outputs/bundle/release/app-release.aab
```

### Database Migration (Production)
```bash
# For production deployment
DATABASE_URL="your_production_database_url" npx prisma db push
```

## 🔧 Configuration Management

### Environment Variables

#### Backend (.env)
```bash
SHOPIFY_API_KEY=prod_api_key
SHOPIFY_API_SECRET=prod_api_secret
SHOPIFY_APP_URL=https://your-production-domain.com
DATABASE_URL=your_production_db_url
WEBSOCKET_PORT=8080
NODE_ENV=production
```

#### Flutter (AppConfig)
```dart
static const String defaultBackendUrl = 'https://your-production-domain.com';
static const String defaultWebsocketUrl = 'wss://your-production-domain.com';
```

## 🚨 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
- **Check**: WebSocket server is running on correct port
- **Check**: Flutter app has correct WebSocket URL
- **Solution**: Ensure firewall allows WebSocket connections

#### 2. API Calls Failing
- **Check**: Backend server is accessible
- **Check**: CORS configuration allows Flutter app domain
- **Solution**: Update API endpoints in Flutter config

#### 3. Shopify Authentication Issues
- **Check**: API credentials are correct
- **Check**: App scopes match requirements
- **Solution**: Regenerate credentials in Shopify Partners dashboard

#### 4. Live Updates Not Working
- **Check**: WebSocket server is running
- **Check**: Flutter app is connected to WebSocket
- **Solution**: Check browser/app console for WebSocket errors

### Debug Commands

```bash
# Check if WebSocket server is running
netstat -an | grep :8080

# Test WebSocket connection
wscat -c ws://localhost:8080

# Check database
npx prisma studio

# Flutter debug
flutter logs
```

## 📞 Support

### Resources
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Remix Documentation](https://remix.run/docs)

### Issues
- Check existing GitHub issues
- Create new issue with reproduction steps
- Include logs and environment details

## 🔄 Updates

### Updating the App
1. Pull latest changes
2. Update dependencies: `npm install` and `flutter pub get`
3. Run database migrations: `npx prisma db push`
4. Restart services

### Version Management
- Backend: Use semantic versioning in `package.json`
- Flutter: Update version in `pubspec.yaml`
- Database: Use Prisma migrations for schema changes

---

🎉 **Congratulations!** Your Eyejack mobile app with live rendering is now deployed and ready for use! 