import { json } from "@remix-run/node";

export async function loader({ request }) {
  // Simple test endpoint that returns default configuration
  // This doesn't require Shopify authentication for testing purposes
  
  const defaultConfig = {
    announcementBar: {
      enabled: true,
      text: "🎉 Welcome to Eyejack Mobile App! Test Mode Active 🚀",
      backgroundColor: "#2563EB",
      textColor: "#FFFFFF",
      fontSize: 14,
      isScrolling: false,
      height: 40
    },
    header: {
      showLogo: true,
      logoUrl: "",
      title: "Eyejack Test Mode",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      showSearch: true,
      showCart: true
    },
    slider: [
      {
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
        title: "Test Mobile App",
        subtitle: "Live rendering system working!",
        buttonText: "Explore",
        buttonAction: "/products",
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
      title: "⭐ Best Sellers",
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
      description: "Your premier mobile shopping experience with live rendering!",
      showSocialLinks: true,
      showQuickLinks: true,
      showContactInfo: true
    },
    bottomNavigation: {
      enabled: true,
      backgroundColor: "#FFFFFF",
      selectedColor: "#2563EB",
      unselectedColor: "#6B7280"
    }
  };

  return json({
    success: true,
    config: defaultConfig,
    message: "Test configuration loaded successfully!",
    timestamp: new Date().toISOString()
  });
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  
  return json({
    success: true,
    message: "Test configuration saved! (In production, this would update the database)",
    receivedConfig: body,
    timestamp: new Date().toISOString()
  });
} 