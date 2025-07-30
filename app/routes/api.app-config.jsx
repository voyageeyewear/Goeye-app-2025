import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";
import LiveRenderingWebSocketServer from "../websocket-server.js";

const prisma = new PrismaClient();

export async function loader({ request }) {
  // For development mode, skip authentication
  const shop = 'development';
  
  try {
    // Try to get existing configuration
    const config = await prisma.appConfig.findUnique({
      where: { shop: shop }
    });

    if (config) {
      return json({
        success: true,
        config: JSON.parse(config.configuration)
      });
    }

    // Return default configuration if none exists
    return json({
      success: true,
      config: getDefaultConfiguration()
    });
  } catch (error) {
    console.error("Error fetching app config:", error);
    return json({
      success: true,
      config: getDefaultConfiguration()
    });
  }
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const shop = 'development';
  const body = await request.json();

  try {
    console.log('💾 Saving configuration:', body);
    
    // Upsert configuration
    await prisma.appConfig.upsert({
      where: { shop: shop },
      update: {
        configuration: JSON.stringify(body),
        updatedAt: new Date()
      },
      create: {
        shop: shop,
        configuration: JSON.stringify(body),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Broadcast configuration update via WebSocket
    console.log('📡 Broadcasting configuration update...');
    await broadcastConfigUpdate(shop, body);

    return json({ 
      success: true,
      message: 'Configuration saved and broadcast successfully!'
    });
  } catch (error) {
    console.error("Error updating app config:", error);
    return json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

function getDefaultConfiguration() {
  return {
    announcementBar: {
      enabled: true,
              text: "🎉 Welcome to our store! Free shipping on orders over ₹50!",
      backgroundColor: "#2563EB",
      textColor: "#FFFFFF",
      fontSize: 14,
      isScrolling: false,
      height: 40
    },
    header: {
      showLogo: true,
      logoUrl: "",
      title: "Eyejack",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      showSearch: true,
      showCart: true
    },
    slider: [
      {
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
        title: "New Collection",
        subtitle: "Discover our latest arrivals",
        buttonText: "Shop Now",
        buttonAction: "/products",
        textOverlay: true,
        textColor: "#FFFFFF"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=400&fit=crop",
        title: "Summer Sale",
        subtitle: "Up to 50% off selected items",
        buttonText: "View Sale",
        buttonAction: "/products?sale=true",
        textOverlay: true,
        textColor: "#FFFFFF"
      }
    ],
    sliderAutoPlay: true,
    sliderAutoPlayInterval: 5,
    sliderShowIndicators: true,
    sliderHeight: 250,
    categories: {
      enabled: true,
      title: "Shop by Category",
      subtitle: "Explore our collection",
      showViewAll: true,
      layout: "grid",
      itemsPerRow: 2
    },
    newArrivals: {
      enabled: true,
      title: "New Arrivals",
      subtitle: "Check out our latest products",
      showViewAll: true,
      layout: "horizontal",
      itemsToShow: 10
    },
    bestSeller: {
      enabled: true,
      title: "Best Sellers",
      subtitle: "Our most popular products",
      showViewAll: true,
      layout: "horizontal",
      itemsToShow: 10,
      showAddToCart: true
    },
    footer: {
      enabled: true,
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
      companyName: "Eyejack",
      description: "Your premier shopping destination for quality products and exceptional service.",
      showSocialLinks: true,
      showQuickLinks: true,
      showContactInfo: true,
      socialLinks: [
        {
          platform: "facebook",
          url: "https://facebook.com/eyejack"
        },
        {
          platform: "instagram",
          url: "https://instagram.com/eyejack"
        },
        {
          platform: "twitter",
          url: "https://twitter.com/eyejack"
        }
      ],
      quickLinks: [
        {
          title: "About Us",
          url: "/about"
        },
        {
          title: "Contact",
          url: "/contact"
        },
        {
          title: "Privacy Policy",
          url: "/privacy"
        },
        {
          title: "Terms of Service",
          url: "/terms"
        }
      ],
      contactInfo: {
        email: "contact@eyejack.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main St, City, State 12345"
      }
    },
    bottomNavigation: {
      enabled: true,
      backgroundColor: "#FFFFFF",
      selectedColor: "#2563EB",
      unselectedColor: "#6B7280",
      items: [
        {
          icon: "home",
          label: "Home"
        },
        {
          icon: "search",
          label: "Search"
        },
        {
          icon: "shopping_cart",
          label: "Cart"
        },
        {
          icon: "person",
          label: "Profile"
        }
      ]
    }
  };
}

async function broadcastConfigUpdate(shop, config) {
  try {
    // Get WebSocket server instance and broadcast
    const wsServer = LiveRenderingWebSocketServer.getInstance();
    wsServer.broadcastConfigUpdate(shop, config);
    
    console.log(`✅ Configuration update broadcasted for shop: ${shop}`);
  } catch (error) {
    console.error("❌ Error broadcasting config update:", error);
    // Don't throw error - config save should succeed even if broadcast fails
  }
} 