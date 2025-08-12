import { json } from "@remix-run/node";
import LiveRenderingWebSocketServer from "../websocket-server.js";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "development";
  
  try {
    const wsServer = LiveRenderingWebSocketServer.getInstance();
    const config = await wsServer.getCurrentConfig(shop);
    
    return json({
      success: true,
      banners: config.banners || {
        enabled: true,
        banners: []
      }
    });
  } catch (error) {
    console.error("Error fetching banner config:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function action({ request }) {
  const shop = "development"; // In production, extract from auth
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    const wsServer = LiveRenderingWebSocketServer.getInstance();
    
    switch (action) {
      case "update_banners": {
        const bannersConfig = JSON.parse(formData.get("banners"));
        
        // Get current config
        const currentConfig = await wsServer.getCurrentConfig(shop);
        
        // Update banner configuration
        const updatedConfig = {
          ...currentConfig,
          banners: bannersConfig
        };
        
        // Broadcast update to all connected clients
        wsServer.broadcastConfigUpdate(shop, { banners: bannersConfig });
        
        console.log(`🎯 Banner configuration updated for shop: ${shop}`);
        
        return json({
          success: true,
          message: "Banner configuration updated successfully",
          banners: bannersConfig
        });
      }
      
      case "toggle_banner": {
        const bannerId = formData.get("bannerId");
        const enabled = formData.get("enabled") === "true";
        
        const currentConfig = await wsServer.getCurrentConfig(shop);
        const banners = currentConfig.banners || { enabled: true, banners: [] };
        
        // Find and update the specific banner
        const bannerIndex = banners.banners.findIndex(b => b.id === bannerId);
        if (bannerIndex !== -1) {
          banners.banners[bannerIndex].enabled = enabled;
          
          const updatedConfig = {
            ...currentConfig,
            banners: banners
          };
          
          // Broadcast update
          wsServer.broadcastConfigUpdate(shop, { banners: banners });
          
          return json({
            success: true,
            message: `Banner ${bannerId} ${enabled ? 'enabled' : 'disabled'}`,
            banners: banners
          });
        } else {
          return json({ error: "Banner not found" }, { status: 404 });
        }
      }
      
      case "add_banner": {
        const newBanner = JSON.parse(formData.get("banner"));
        
        const currentConfig = await wsServer.getCurrentConfig(shop);
        const banners = currentConfig.banners || { enabled: true, banners: [] };
        
        // Add new banner
        banners.banners.push({
          id: `banner_${Date.now()}`,
          ...newBanner,
          enabled: true
        });
        
        const updatedConfig = {
          ...currentConfig,
          banners: banners
        };
        
        // Broadcast update
        wsServer.broadcastConfigUpdate(shop, { banners: banners });
        
        return json({
          success: true,
          message: "New banner added successfully",
          banners: banners
        });
      }
      
      case "delete_banner": {
        const bannerId = formData.get("bannerId");
        
        const currentConfig = await wsServer.getCurrentConfig(shop);
        const banners = currentConfig.banners || { enabled: true, banners: [] };
        
        // Remove banner
        banners.banners = banners.banners.filter(b => b.id !== bannerId);
        
        const updatedConfig = {
          ...currentConfig,
          banners: banners
        };
        
        // Broadcast update
        wsServer.broadcastConfigUpdate(shop, { banners: banners });
        
        return json({
          success: true,
          message: "Banner deleted successfully",
          banners: banners
        });
      }
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Banner API Error:", error);
    return json({ error: error.message }, { status: 500 });
  }
} 