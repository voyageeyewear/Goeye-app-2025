import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";

function getDefaultConfiguration() {
  const defaultConfig = {
    announcementBar: {
      enabled: true,
      text: "Free shipping on orders $50+",
      announcements: [
        "Free shipping on orders $50+",
        "🎉 Flash Sale - 50% OFF!",
        "✨ Get 20% off - WELCOME20",
        "🚚 Same-day delivery"
      ],
      backgroundColor: "#FF6B35",
      textColor: "#FFFFFF",
      fontSize: 16,
      height: 60,
      autoSlide: true,
      slideInterval: 4000,
      showNavigation: true
    },
    header: {
      showLogo: true,
      logoUrl: "",
      title: "EyeJack",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      showSearch: true,
      showCart: true,
      showProfile: true,
      selectedMenu: "collections"
    },
    search: {
      enabled: true,
      placeholder: "Search products...",
      showSuggestions: true,
      showHistory: true,
      showFilters: true,
      instantSearch: true,
      resultsPerPage: 20,
      defaultSort: "relevance",
      searchScope: "all",
      minLength: 2
    },
    slider: {
      enabled: true,
      autoplay: true,
      interval: 5000,
      showIndicators: true,
      showNavigation: false,
      transitionEffect: "slide",
      slides: [
        {
          id: 1,
          title: "Live Rendering",
          subtitle: "Experience real-time app updates!",
          buttonText: "Explore Now",
          buttonAction: "explore",
          backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
          overlayOpacity: 0.4,
          textColor: "#FFFFFF",
          enabled: true
        },
        {
          id: 2,
          title: "Shop Collections",
          subtitle: "Discover our curated selections",
          buttonText: "Shop Now",
          buttonAction: "collections",
          backgroundImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
          overlayOpacity: 0.4,
          textColor: "#FFFFFF",
          enabled: true
        },
        {
          id: 3,
          title: "Best Sellers",
          subtitle: "Top-rated by customers",
          buttonText: "View All",
          buttonAction: "bestsellers",
          backgroundImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
          overlayOpacity: 0.4,
          textColor: "#FFFFFF",
          enabled: true
        }
      ]
    },
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
      companyName: "EyeJack",
      description: "Your premier AR shopping experience",
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
  
  return defaultConfig;
}

export async function loader() {
  let shopifyCollections = [];
  let shopifyProducts = [];
  
  try {
    const collectionsResponse = await fetch('http://localhost:3000/api/shopify-products?type=collections&limit=20');
    if (collectionsResponse.ok) {
      const collectionsData = await collectionsResponse.json();
      if (collectionsData.success) {
        shopifyCollections = collectionsData.collections;
      }
    }
    
    const productsResponse = await fetch('http://localhost:3000/api/shopify-products?type=products&limit=10');
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      if (productsData.success) {
        shopifyProducts = productsData.products;
      }
    }
  } catch (error) {
    console.error('Error fetching Shopify data:', error);
  }
  
  return json({ 
    config: getDefaultConfiguration(),
    shopifyCollections,
    shopifyProducts,
    message: "🎛️ Live Rendering Configuration Panel loaded successfully!"
  });
}

export async function action({ request }) {
  const formData = await request.formData();
  const configData = formData.get("config");

  try {
    const config = JSON.parse(configData);
    
    // Save configuration via API
      const response = await fetch('http://localhost:3000/api/app-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify(config),
      });
      
      if (response.ok) {
        return json({ 
          success: true, 
        message: "✅ Configuration saved and broadcast successfully!"
        });
      } else {
        throw new Error('Failed to save configuration');
      }
  } catch (error) {
    console.error("Error saving config:", error);
    
    return json({ 
      success: false, 
      message: "❌ Failed to save configuration: " + error.message
    });
  }
}

export default function AdminLiveRenderingDev() {
  const { config: initialConfig, shopifyCollections, shopifyProducts, message } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [config, setConfig] = useState(initialConfig || getDefaultConfiguration());
  const [selectedTab, setSelectedTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const updateConfig = useCallback((section, updates) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  }, []);

  const handleAutoSave = useCallback(() => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("config", JSON.stringify(config));
    submit(formData, { method: "post" });
    setLastSaved(new Date().toLocaleTimeString());
    setIsSaving(false);
  }, [config, submit]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("config", JSON.stringify(config));
    submit(formData, { method: "post" });
    setLastSaved(new Date().toLocaleTimeString());
  }, [config, submit]);

  const tabs = [
    { id: 'announcement', label: '📢 Announcement', icon: '📢' },
    { id: 'header', label: '🏠 Header', icon: '🏠' },
    { id: 'search', label: '🔍 Search', icon: '🔍' },
    { id: 'slider', label: '🎨 Hero Slider', icon: '🎨' },
    { id: 'categories', label: '📂 Categories', icon: '📂' },
    { id: 'products', label: '🛍️ Products', icon: '🛍️' },
    { id: 'footer', label: '📄 Footer', icon: '📄' }
  ];

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '30px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '10px' }}>
          🎛️ EyeJack Live Rendering Configuration
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: '0.9', marginBottom: '20px' }}>
          Configure your mobile app in real-time and see changes instantly!
        </p>
        
          <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '5px' }}>📱</div>
            <div style={{ fontWeight: '600' }}>Mobile Ready</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '5px' }}>⚡</div>
            <div style={{ fontWeight: '600' }}>Live Updates</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🛍️</div>
            <div style={{ fontWeight: '600' }}>Shopify Connected</div>
          </div>
        </div>
      </div>

      {/* Action Messages */}
        {actionData?.message && (
          <div style={{
          background: actionData.success ? '#10B981' : '#EF4444',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
            marginBottom: '20px',
          fontWeight: '600',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
          {actionData.message}
          </div>
        )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? '⏳ Saving...' : '💾 Save & Broadcast'}
          </button>
          
          <button
            onClick={handleAutoSave}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⚡ Quick Save
          </button>

          <button 
            onClick={() => window.open('/mobile-app.html', '_blank')}
            style={{
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📱</span>
            Preview Mobile App
          </button>

          <button 
            onClick={() => setShowPreviewModal(true)}
            style={{
              background: '#F59E0B',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👁️</span>
            Live Preview
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {lastSaved && (
            <div style={{ color: '#6B7280', fontSize: '14px' }}>
              Last saved: {lastSaved}
            </div>
          )}
          <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>
            Changes broadcast live via WebSocket
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(index)}
              style={{
              flex: '1',
              minWidth: '140px',
              padding: '12px 16px',
                border: 'none',
              borderRadius: '8px',
              background: selectedTab === index ? '#3B82F6' : 'transparent',
              color: selectedTab === index ? 'white' : '#6B7280',
              fontWeight: selectedTab === index ? '600' : '500',
                cursor: 'pointer',
              transition: 'all 0.2s',
              borderBottom: selectedTab === index ? '3px solid #1D4ED8' : '3px solid transparent',
              transform: selectedTab === index ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: selectedTab === index ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedTab !== index) {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTab !== index) {
                e.target.style.background = 'transparent';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {selectedTab === 0 && <AnnouncementConfig config={config.announcementBar} updateConfig={updateConfig} />}
          {selectedTab === 1 && <HeaderConfig config={config.header} updateConfig={updateConfig} />}
        {selectedTab === 2 && <SearchConfig config={config.search} updateConfig={updateConfig} />}
        {selectedTab === 3 && <SliderConfig config={config.slider} updateConfig={updateConfig} />}
        {selectedTab === 4 && <div>📂 Categories Configuration coming soon...</div>}
        {selectedTab === 5 && <div>🛍️ Products Configuration coming soon...</div>}
        {selectedTab === 6 && <div>📄 Footer Configuration coming soon...</div>}
        </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1200px',
            height: '90%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '5px' }}>
                  📱 Live Mobile App Preview
                </h3>
                <p style={{ opacity: '0.9', fontSize: '14px' }}>
                  Real-time preview of your EyeJack mobile app with current configuration
                </p>
      </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>

            {/* Mobile Preview Container */}
            <div style={{
              flex: 1,
              padding: '20px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '375px',
                height: '812px',
                background: 'white',
                borderRadius: '30px',
                border: '8px solid #1f2937',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Mobile Screen */}
                <iframe
                  src="/mobile-app.html"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '22px'
                  }}
                  title="Mobile App Preview"
                />
                
                {/* Mobile Frame Elements */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '134px',
                  height: '5px',
                  background: '#1f2937',
                  borderRadius: '3px'
                }}></div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px 20px',
              background: '#f9fafb',
              borderRadius: '0 0 16px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                🔄 Preview updates automatically when you save changes
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Mobile App Preview"]');
                    if (iframe) iframe.src = iframe.src;
                  }}
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => window.open('/mobile-app.html', '_blank')}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementConfig({ config, updateConfig }) {
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  
  // Get announcements array or fallback to single text
  const announcements = config.announcements || [config.text || 'Free Moisturizer with Every Order!'];

  const addAnnouncement = () => {
    if (newAnnouncementText.trim()) {
      const updatedAnnouncements = [...announcements, newAnnouncementText.trim()];
      updateConfig('announcementBar', { announcements: updatedAnnouncements });
      setNewAnnouncementText('');
    }
  };

  const removeAnnouncement = (index) => {
    const updatedAnnouncements = announcements.filter((_, i) => i !== index);
    updateConfig('announcementBar', { announcements: updatedAnnouncements });
  };

  const updateAnnouncement = (index, newText) => {
    const updatedAnnouncements = [...announcements];
    updatedAnnouncements[index] = newText;
    updateConfig('announcementBar', { announcements: updatedAnnouncements });
  };

  return (
    <div style={{ display: 'grid', gap: '25px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        borderRadius: '12px',
        padding: '25px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '10px' }}>
          📢 Announcement Bar Configuration
      </h3>
        <p style={{ opacity: '0.9', fontSize: '1.1rem' }}>
          Configure scrolling announcements with auto-slide functionality and custom styling.
        </p>
      </div>
      
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => updateConfig('announcementBar', { enabled: e.target.checked })}
          style={{ width: '18px', height: '18px' }}
        />
          <span style={{ fontWeight: '600' }}>Enable announcement bar</span>
      </label>
      </div>

      {config.enabled && (
        <>
          {/* Multiple Announcements Management */}
          <div style={{
            background: '#f0f9ff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #0ea5e9'
          }}>
            <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '15px' }}>
              📝 Manage Announcements
            </h4>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Add New Announcement
        </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  placeholder="Enter announcement text..."
          style={{
                    flex: 1,
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addAnnouncement();
                    }
                  }}
                />
                <button
                  onClick={addAnnouncement}
                  disabled={!newAnnouncementText.trim()}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: newAnnouncementText.trim() ? 'pointer' : 'not-allowed',
                    opacity: newAnnouncementText.trim() ? 1 : 0.5
                  }}
                >
                  Add
                </button>
              </div>
      </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
                Current Announcements ({announcements.length})
              </label>
              {announcements.map((announcement, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                    alignItems: 'center'
                  }}
                >
                  <span style={{
                    background: '#2563eb',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={announcement}
                    onChange={(e) => updateAnnouncement(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    onClick={() => removeAnnouncement(index)}
                    disabled={announcements.length <= 1}
                    style={{
                      background: announcements.length > 1 ? '#ef4444' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: announcements.length > 1 ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-slide Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={config.autoSlide !== false}
                  onChange={(e) => updateConfig('announcementBar', { autoSlide: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '600' }}>Auto-slide announcements</span>
              </label>
              
              {config.autoSlide !== false && (
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Slide interval (seconds)
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={(config.slideInterval || 4000) / 1000}
                    onChange={(e) => updateConfig('announcementBar', { slideInterval: parseFloat(e.target.value) * 1000 })}
                    style={{ width: '100%', marginBottom: '5px' }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                    {((config.slideInterval || 4000) / 1000).toFixed(1)}s
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={config.showNavigation !== false}
                  onChange={(e) => updateConfig('announcementBar', { showNavigation: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '600' }}>Show navigation arrows</span>
              </label>
            </div>
          </div>

          {/* Styling Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
            Background color
          </label>
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => updateConfig('announcementBar', { backgroundColor: e.target.value })}
            style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
            Text color
          </label>
          <input
            type="color"
            value={config.textColor}
            onChange={(e) => updateConfig('announcementBar', { textColor: e.target.value })}
            style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px' }}
          />
        </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                Font size: {config.fontSize || 16}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={config.fontSize || 16}
                onChange={(e) => updateConfig('announcementBar', { fontSize: parseInt(e.target.value) })}
                style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
          Live Preview
        </label>
        <div
          style={{
            background: config.backgroundColor,
            color: config.textColor,
                padding: '15px 20px',
            borderRadius: '8px',
            textAlign: 'center',
                fontSize: (config.fontSize || 16) + 'px',
                fontWeight: '500',
                position: 'relative',
                border: '1px solid #e5e7eb'
          }}
        >
              {config.showNavigation !== false && announcements.length > 1 && (
                <>
                  <div style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>
                    ←
        </div>
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>
                    →
      </div>
                </>
              )}
              {announcements[0] || 'Your announcement text will appear here'}
            </div>
            
            {config.autoSlide !== false && announcements.length > 1 && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                ✅ Announcements will auto-slide every {((config.slideInterval || 4000) / 1000).toFixed(1)} seconds
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function HeaderConfig({ config, updateConfig }) {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(config?.logoUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  // Update logo preview when config changes
  useEffect(() => {
    if (config?.logoUrl !== logoPreview) {
      setLogoPreview(config?.logoUrl || '');
    }
  }, [config?.logoUrl]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Please upload an image smaller than 2MB');
      return;
    }

    setIsUploading(true);
    setLogoFile(file);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // For now, we'll use a data URL for the logo
      // In production, you'd upload to a cloud service
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        updateConfig('header', { logoUrl: dataUrl });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    updateConfig('header', { logoUrl: '' });
  };

  const handleLogoUrlChange = (e) => {
    const url = e.target.value.trim();
    
    // Clear file upload if URL is being used
    if (url && logoFile) {
      setLogoFile(null);
    }
    
    if (url) {
      setLogoPreview(url);
      updateConfig('header', { logoUrl: url });
    } else {
      setLogoPreview('');
      updateConfig('header', { logoUrl: '' });
    }
  };

  return (
    <div style={{ display: 'grid', gap: '25px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
        borderRadius: '12px',
        padding: '25px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '10px' }}>
          🏠 EyeJack Header Configuration
      </h3>
        <p style={{ opacity: '0.9', fontSize: '1.1rem' }}>
          Configure the main header with logo, navigation, and functional icons.
        </p>
      </div>

      {/* Logo Upload Section */}
      <div style={{
        background: '#f0f9ff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #0ea5e9'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '8px' }}>
            🖼️ Logo Upload & Live Update
          </h4>
          <p style={{ color: '#075985', fontSize: '14px', margin: 0 }}>
            Upload your EyeJack logo or load from URL and see it update instantly on your mobile app! 
            Supports PNG, JPG, SVG, and WebP formats.
          </p>
        </div>
        
        {/* Two options: File Upload and URL */}
        <div style={{ display: 'grid', gap: '25px' }}>
          
          {/* Option 1: File Upload */}
          <div style={{
            background: '#fefefe',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
              📁 Option 1: Upload Logo File
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'start' }}>
      <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Choose File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px dashed #0ea5e9',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#075985', marginTop: '8px' }}>
                  Supports: PNG, JPG, SVG, WebP (Max 2MB)
                </div>
                {isUploading && (
                  <div style={{ fontSize: '12px', color: '#0ea5e9', marginTop: '8px' }}>
                    📤 Uploading logo...
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  File Preview
                </label>
                <div style={{
                  width: '100%',
                  height: '70px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {logoPreview && logoFile ? (
                    <>
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        style={{ 
                          maxHeight: '50px', 
                          maxWidth: '100%', 
                          objectFit: 'contain' 
                        }} 
                      />
                      <button
                        onClick={removeLogo}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>No file selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            margin: '0 10px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
            <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
          </div>

          {/* Option 2: URL Input */}
          <div style={{
            background: '#fefefe',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
              🌐 Option 2: Load Logo from URL
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Logo URL
                </label>
                <input
                  type="url"
                  value={config?.logoUrl && !logoFile ? config.logoUrl : ''}
                  onChange={handleLogoUrlChange}
                  placeholder="https://example.com/logo.png"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#075985', marginTop: '8px' }}>
                  Enter a direct link to your logo image
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  URL Preview
                </label>
                <div style={{
                  width: '100%',
                  height: '70px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {logoPreview && !logoFile ? (
                    <>
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        style={{ 
                          maxHeight: '50px', 
                          maxWidth: '100%', 
                          objectFit: 'contain' 
                        }}
                        onError={() => setLogoPreview('')}
                      />
                      <button
                        onClick={() => {
                          setLogoPreview('');
                          updateConfig('header', { logoUrl: '' });
                        }}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>No URL provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Final Preview Section */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            🎯 Final Logo Preview
          </label>
          <div style={{
            width: '100%',
            height: '100px',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {logoPreview ? (
              <>
                <img 
                  src={logoPreview} 
                  alt="Final Logo Preview" 
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '90%', 
                    objectFit: 'contain' 
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '10px',
                  background: '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {logoFile ? 'FILE' : 'URL'}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Your logo will appear here</div>
                <div style={{ fontSize: '12px' }}>Upload a file or enter a URL above</div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div style={{
          background: '#ecfdf5',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '15px',
          border: '1px solid #10b981'
        }}>
          <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
            📋 How to Use Logo Upload:
          </h5>
          <ol style={{ color: '#047857', fontSize: '13px', paddingLeft: '16px', margin: 0 }}>
            <li>Choose either "Upload File" or "Load from URL"</li>
            <li>Watch the preview update instantly</li>
            <li>Click "Save & Broadcast" to push the logo to your mobile app</li>
            <li>Check your mobile app to see the logo update in real-time!</li>
          </ol>
        </div>
      </div>
      
      <div>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
          App title (fallback when no logo)
        </label>
        <input
          type="text"
          value={config?.title || 'EyeJack'}
          onChange={(e) => updateConfig('header', { title: e.target.value })}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px'
          }}
          placeholder="Enter app title (e.g., EyeJack)..."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
            Background color
          </label>
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => updateConfig('header', { backgroundColor: e.target.value })}
            style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
            Text color
          </label>
          <input
            type="color"
            value={config.textColor}
            onChange={(e) => updateConfig('header', { textColor: e.target.value })}
            style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
            Menu Type
          </label>
          <select
            value={config.selectedMenu || 'none'}
            onChange={(e) => updateConfig('header', { selectedMenu: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="none">No Menu</option>
            <option value="main">Main Navigation</option>
            <option value="collections">Shopify Collections</option>
            <option value="custom">Custom Menu</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={config.showSearch}
            onChange={(e) => updateConfig('header', { showSearch: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '500' }}>Search</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={config.showProfile !== false}
            onChange={(e) => updateConfig('header', { showProfile: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '500' }}>Profile</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={config.showCart}
            onChange={(e) => updateConfig('header', { showCart: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '500' }}>Cart</span>
        </label>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={config.sticky !== false}
          onChange={(e) => updateConfig('header', { sticky: e.target.checked })}
          style={{ width: '18px', height: '18px' }}
        />
        <span style={{ fontWeight: '500' }}>Make header sticky (fixed at top)</span>
      </label>

      {/* Live Preview */}
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
          📱 Live Header Preview
        </label>
        <div
          style={{
            background: config?.backgroundColor || '#FFFFFF',
            color: config?.textColor || '#1F2937',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minHeight: '56px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {config?.showMenu !== false && <span style={{ fontSize: '18px' }}>≡</span>}
            {config?.showSearch && <span style={{ fontSize: '16px' }}>🔍</span>}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '32px'
          }}>
            {config?.logoUrl && config.logoUrl.trim() !== '' ? (
              <img 
                src={config.logoUrl} 
                alt={config?.title || 'EyeJack'} 
                style={{ 
                  height: '28px', 
                  maxWidth: '100px', 
                  objectFit: 'contain' 
                }} 
              />
            ) : (
              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                {config?.title || 'EyeJack'}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {config?.showProfile !== false && <span style={{ fontSize: '16px' }}>👤</span>}
            {config?.showCart && (
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: '16px' }}>🛒</span>
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>0</span>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          {config?.logoUrl && config.logoUrl.trim() !== '' ? (
            <span>✅ Custom logo will be displayed</span>
          ) : (
            <span>📝 Text logo will be displayed</span>
          )}
          {config?.sticky !== false && ' • Header will stick to top when scrolling'}
        </div>
      </div>
    </div>
  );
}

function SearchConfig({ config, updateConfig }) {
  return (
    <div style={{ display: 'grid', gap: '25px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '12px',
        padding: '25px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '10px' }}>
          🔍 Smart Search Configuration
      </h3>
        <p style={{ opacity: '0.9', fontSize: '1.1rem' }}>
          Configure intelligent search with real-time Shopify product search, suggestions, and filters.
      </p>
    </div>
      
      <div style={{ 
        background: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #0ea5e9'
      }}>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '15px' }}>
          🎯 Search Features
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
              checked={config?.enabled !== false}
              onChange={(e) => updateConfig('search', { enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
            <span style={{ fontWeight: '500' }}>Enable search functionality</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.showSuggestions !== false}
              onChange={(e) => updateConfig('search', { showSuggestions: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500' }}>Show search suggestions</span>
          </label>
                
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.instantSearch !== false}
              onChange={(e) => updateConfig('search', { instantSearch: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500' }}>Instant search (real-time)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.showFilters !== false}
              onChange={(e) => updateConfig('search', { showFilters: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500' }}>Show search filters</span>
          </label>
                </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Search placeholder text
          </label>
          <input
            type="text"
            value={config?.placeholder || 'Search products...'}
            onChange={(e) => updateConfig('search', { placeholder: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Results per page: {config?.resultsPerPage || 20}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={config?.resultsPerPage || 20}
            onChange={(e) => updateConfig('search', { resultsPerPage: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Default sort order
          </label>
          <select
            value={config?.defaultSort || 'relevance'}
            onChange={(e) => updateConfig('search', { defaultSort: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="relevance">Most Relevant</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="title">A-Z</option>
            <option value="created">Newest First</option>
          </select>
      </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Search scope
      </label>
          <select
            value={config?.searchScope || 'all'}
            onChange={(e) => updateConfig('search', { searchScope: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Products</option>
            <option value="title">Product Names Only</option>
            <option value="description">Include Descriptions</option>
            <option value="vendor">Include Vendors</option>
          </select>
        </div>
      </div>

      {/* Search Preview */}
        <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
          🔍 Search Bar Preview
          </label>
          <div style={{
          background: '#2563EB',
          padding: '15px 20px',
            borderRadius: '8px',
          color: 'white'
          }}>
            <div style={{ 
            background: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
            padding: '12px 15px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
                }}>
            <span style={{ fontSize: '16px' }}>🔍</span>
            <span style={{ flex: 1, color: '#6b7280' }}>
              {config?.placeholder || 'Search products...'}
            </span>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>×</span>
                  </div>
                  </div>
        
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          ✅ Search connects to your Shopify store for real product results
          {config?.instantSearch !== false && ' • Real-time search enabled'}
          {config?.showSuggestions !== false && ' • Search suggestions enabled'}
                </div>
            </div>
    </div>
  );
}

function SliderConfig({ config, updateConfig }) {
  const [newSlide, setNewSlide] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Learn More',
    buttonAction: 'custom',
    backgroundImage: '',
    overlayOpacity: 0.4,
    textColor: '#FFFFFF',
    enabled: true
  });
  const [editingSlide, setEditingSlide] = useState(null);

  const addSlide = () => {
    if (newSlide.title && newSlide.backgroundImage) {
      const slides = config.slides || [];
      const newSlideWithId = {
        ...newSlide,
        id: Date.now()
      };
      updateConfig('slider', { slides: [...slides, newSlideWithId] });
      setNewSlide({
        title: '',
        subtitle: '',
        buttonText: 'Learn More',
        buttonAction: 'custom',
        backgroundImage: '',
        overlayOpacity: 0.4,
        textColor: '#FFFFFF',
        enabled: true
      });
    }
  };

  const removeSlide = (slideId) => {
    const updatedSlides = config.slides.filter(slide => slide.id !== slideId);
    updateConfig('slider', { slides: updatedSlides });
  };

  const updateSlide = (slideId, updates) => {
    const updatedSlides = config.slides.map(slide => 
      slide.id === slideId ? { ...slide, ...updates } : slide
    );
    updateConfig('slider', { slides: updatedSlides });
  };

  const duplicateSlide = (slide) => {
    const newSlideData = {
      ...slide,
      id: Date.now(),
      title: slide.title + ' (Copy)'
    };
    updateConfig('slider', { slides: [...config.slides, newSlideData] });
  };

  return (
    <div style={{ display: 'grid', gap: '25px' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        borderRadius: '12px',
        padding: '25px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '10px' }}>
          🎨 Hero Slider Configuration
        </h3>
        <p style={{ opacity: '0.9', fontSize: '1.1rem' }}>
          Create stunning hero slides with custom images, text, and call-to-action buttons.
        </p>
      </div>

      {/* Slider Settings */}
          <div style={{ 
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1e293b', marginBottom: '15px' }}>
          ⚙️ Slider Settings
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.enabled !== false}
              onChange={(e) => updateConfig('slider', { enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>Enable Hero Slider</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.autoplay !== false}
              onChange={(e) => updateConfig('slider', { autoplay: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>Auto-play slides</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.showIndicators !== false}
              onChange={(e) => updateConfig('slider', { showIndicators: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>Show dot indicators</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={config?.showNavigation === true}
              onChange={(e) => updateConfig('slider', { showNavigation: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>Show arrow navigation</span>
          </label>
                  </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Slide interval: {((config?.interval || 5000) / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={(config?.interval || 5000) / 1000}
              onChange={(e) => updateConfig('slider', { interval: parseFloat(e.target.value) * 1000 })}
              style={{ width: '100%' }}
            />
                  </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Transition Effect
            </label>
            <select
              value={config?.transitionEffect || 'slide'}
              onChange={(e) => updateConfig('slider', { transitionEffect: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
            borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="zoom">Zoom</option>
              <option value="flip">Flip</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add New Slide */}
      <div style={{ 
        background: '#f0f9ff',
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #0ea5e9'
      }}>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '15px' }}>
          ➕ Add New Slide
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Slide Title *
            </label>
            <input
              type="text"
              value={newSlide.title}
              onChange={(e) => setNewSlide({...newSlide, title: e.target.value})}
              placeholder="Enter slide title..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Subtitle
            </label>
            <input
              type="text"
              value={newSlide.subtitle}
              onChange={(e) => setNewSlide({...newSlide, subtitle: e.target.value})}
              placeholder="Enter subtitle..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Background Image URL *
            </label>
          <input
              type="url"
              value={newSlide.backgroundImage}
              onChange={(e) => setNewSlide({...newSlide, backgroundImage: e.target.value})}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
      </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Button Text
            </label>
            <input
              type="text"
              value={newSlide.buttonText}
              onChange={(e) => setNewSlide({...newSlide, buttonText: e.target.value})}
              placeholder="Learn More"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          </div>
          
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Button Action
            </label>
            <select
              value={newSlide.buttonAction}
              onChange={(e) => setNewSlide({...newSlide, buttonAction: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="explore">Explore Products</option>
              <option value="collections">View Collections</option>
              <option value="bestsellers">Best Sellers</option>
              <option value="deals">Deals & Offers</option>
              <option value="custom">Custom Action</option>
            </select>
        </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Text Color
            </label>
          <input
              type="color"
              value={newSlide.textColor}
              onChange={(e) => setNewSlide({...newSlide, textColor: e.target.value})}
              style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px' }}
          />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Overlay Opacity: {(newSlide.overlayOpacity * 100).toFixed(0)}%
        </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.1"
              value={newSlide.overlayOpacity}
              onChange={(e) => setNewSlide({...newSlide, overlayOpacity: parseFloat(e.target.value)})}
              style={{ width: '100%' }}
            />
          </div>
      </div>

        <button
          onClick={addSlide}
          disabled={!newSlide.title || !newSlide.backgroundImage}
          style={{
            background: !newSlide.title || !newSlide.backgroundImage ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: !newSlide.title || !newSlide.backgroundImage ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          ➕ Add Slide
        </button>
      </div>

      {/* Existing Slides */}
      <div>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1e293b', marginBottom: '15px' }}>
          🎯 Current Slides ({config?.slides?.length || 0})
        </h4>
        
        {config?.slides?.length === 0 ? (
      <div style={{ 
            textAlign: 'center',
            padding: '40px',
            background: '#f9fafb',
            borderRadius: '12px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎨</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No slides created yet</div>
            <div>Add your first slide above to get started!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {config.slides.map((slide, index) => (
              <div
                key={slide.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr auto',
                  gap: '20px',
                  padding: '20px',
                  alignItems: 'center'
                }}>
                  {/* Slide Preview */}
                  <div style={{
                    width: '200px',
                    height: '100px',
        borderRadius: '8px',
                    backgroundImage: `linear-gradient(rgba(0,0,0,${slide.overlayOpacity}), rgba(0,0,0,${slide.overlayOpacity})), url('${slide.backgroundImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: slide.textColor,
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
                      {slide.title}
          </div>
                    <div style={{ fontSize: '11px', opacity: '0.9' }}>
                      {slide.subtitle}
          </div>
                    {slide.buttonText && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        background: 'rgba(255,255,255,0.9)',
                        color: '#1f2937',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        {slide.buttonText}
        </div>
                    )}
      </div>

                  {/* Slide Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{
                        background: '#2563eb',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Slide {index + 1}
                      </span>
                      <span style={{
                        background: slide.enabled ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {slide.enabled ? 'Active' : 'Disabled'}
                      </span>
    </div>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      {slide.title}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                      {slide.subtitle}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Action: {slide.buttonAction} • Overlay: {(slide.overlayOpacity * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Slide Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => updateSlide(slide.id, { enabled: !slide.enabled })}
                      style={{
                        background: slide.enabled ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {slide.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => duplicateSlide(slide)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => removeSlide(slide.id)}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview */}
      {config?.slides?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            📱 Slider Preview
          </label>
          <div style={{
            width: '100%',
            height: '250px',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {config.slides.filter(slide => slide.enabled).length > 0 ? (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(rgba(0,0,0,${config.slides[0].overlayOpacity}), rgba(0,0,0,${config.slides[0].overlayOpacity})), url('${config.slides[0].backgroundImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: config.slides[0].textColor,
                textAlign: 'center'
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', margin: 0 }}>
                  {config.slides[0].title}
                </h2>
                <p style={{ fontSize: '16px', marginBottom: '20px', opacity: '0.9', margin: '0 0 20px 0' }}>
                  {config.slides[0].subtitle}
                </p>
                {config.slides[0].buttonText && (
                  <button style={{
                    background: 'white',
                    color: '#2563EB',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '25px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    {config.slides[0].buttonText}
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}>
                No active slides to preview
              </div>
            )}
            
            {config?.showIndicators && config.slides.filter(slide => slide.enabled).length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px'
              }}>
                {config.slides.filter(slide => slide.enabled).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: index === 0 ? 'white' : 'rgba(255,255,255,0.5)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            ✅ Showing slide 1 of {config.slides.filter(slide => slide.enabled).length} active slides
            {config?.autoplay && ` • Auto-advance every ${((config.interval || 5000) / 1000).toFixed(1)}s`}
          </div>
        </div>
      )}
    </div>
  );
} 