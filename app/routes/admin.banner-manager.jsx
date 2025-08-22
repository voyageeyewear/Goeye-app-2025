import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useRevalidator } from "@remix-run/react";
import { useState, useEffect } from "react";

export async function loader() {
  try {
    // Fetch current banner configuration
    const response = await fetch('http://localhost:3001/api/banner-config');
    const data = await response.json();
    
    return json({
      banners: data.banners || { enabled: true, banners: [] },
      success: true
    });
  } catch (error) {
    console.error("Error loading banners:", error);
    return json({
      banners: { enabled: true, banners: [] },
      success: false,
      error: error.message
    });
  }
}

export default function BannerManager() {
  const { banners } = useLoaderData();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [previewBanner, setPreviewBanner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection disabled - live rendering system removed
  useEffect(() => {
    console.log('ℹ️ Live rendering system disabled');
    setIsConnected(false);
  }, []);

  const themes = [
    { value: 'orange', name: 'Orange (Flash Sales)', color: '#ff6b35' },
    { value: 'purple', name: 'Purple (New Arrivals)', color: '#8b5cf6' },
    { value: 'green', name: 'Green (Shipping/Eco)', color: '#11998e' },
    { value: 'red', name: 'Red (Urgent/Premium)', color: '#ef4444' },
    { value: '', name: 'Default (Blue)', color: '#667eea' }
  ];

  const actionTypes = [
    { value: 'collection', name: 'Navigate to Collection' },
    { value: 'external', name: 'Open External URL' },
    { value: 'product', name: 'Show Product Detail' }
  ];

  const toggleBanner = (bannerId, enabled) => {
    const formData = new FormData();
    formData.append('action', 'toggle_banner');
    formData.append('bannerId', bannerId);
    formData.append('enabled', enabled.toString());
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/banner-config'
    });
  };

  const deleteBanner = (bannerId) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      const formData = new FormData();
      formData.append('action', 'delete_banner');
      formData.append('bannerId', bannerId);
      
      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/banner-config'
      });
    }
  };

  const addNewBanner = (bannerData) => {
    const formData = new FormData();
    formData.append('action', 'add_banner');
    formData.append('banner', JSON.stringify(bannerData));
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/banner-config'
    });
  };

  // Refresh data when fetcher completes
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          🎯 Banner Manager - Live Rendering System
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ 
            color: isConnected ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {isConnected ? '🟢 Connected to Live System' : '🔴 Disconnected'}
          </span>
          <a 
            href="http://localhost:3001/mobile-app.html" 
            target="_blank"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📱 View Mobile App
          </a>
        </div>
      </div>

      {/* Current Banners */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
          Current Banners ({banners.banners?.length || 0})
        </h2>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          {banners.banners?.map((banner, index) => (
            <div 
              key={banner.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {banner.title}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: themes.find(t => t.value === banner.theme)?.color || '#667eea',
                      color: 'white'
                    }}>
                      {banner.theme || 'default'}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: banner.enabled ? '#d1fae5' : '#fee2e2',
                      color: banner.enabled ? '#065f46' : '#991b1b'
                    }}>
                      {banner.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: '#6b7280', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    margin: '0 0 8px 0'
                  }}>
                    {banner.subtitle}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
                    <span><strong>CTA:</strong> {banner.cta}</span>
                    <span><strong>Action:</strong> {banner.action}</span>
                    <span><strong>Data:</strong> {banner.actionData}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => toggleBanner(banner.id, !banner.enabled)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: banner.enabled ? '#fbbf24' : '#10b981',
                      color: 'white'
                    }}
                  >
                    {banner.enabled ? 'Disable' : 'Enable'}
                  </button>
                  
                  <button
                    onClick={() => setPreviewBanner(banner)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#374151'
                    }}
                  >
                    Preview
                  </button>
                  
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: '#ef4444',
                      color: 'white'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Banner Form */}
      <div style={{ 
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        padding: '30px',
        backgroundColor: '#f9fafb',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>
          ➕ Add New Banner
        </h2>
        
        <NewBannerForm onSubmit={addNewBanner} themes={themes} actionTypes={actionTypes} />
      </div>

      {/* Preview Modal */}
      {previewBanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Banner Preview
            </h3>
            
            <div style={{
              background: `linear-gradient(135deg, ${themes.find(t => t.value === previewBanner.theme)?.color || '#667eea'} 0%, #764ba2 100%)`,
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                {previewBanner.title}
              </div>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '12px' }}>
                {previewBanner.subtitle}
              </div>
              <span style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {previewBanner.cta}
              </span>
            </div>
            
            <button
              onClick={() => setPreviewBanner(null)}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#6b7280',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>💡 How it works:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>Banners appear after every 4 products in the collection grid</li>
          <li>Changes are applied instantly via WebSocket to all connected mobile apps</li>
          <li>Test your changes by opening the mobile app in another tab</li>
          <li>Navigate to "All Products" in the mobile app to see banners</li>
        </ul>
      </div>
    </div>
  );
}

function NewBannerForm({ onSubmit, themes, actionTypes }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta: '',
    theme: 'orange',
    action: 'collection',
    actionData: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.subtitle && formData.cta) {
      onSubmit(formData);
      setFormData({
        title: '',
        subtitle: '',
        cta: '',
        theme: 'orange',
        action: 'collection',
        actionData: ''
      });
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
            Banner Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="🎯 Flash Sale!"
            style={inputStyle}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
            Theme
          </label>
          <select
            value={formData.theme}
            onChange={(e) => setFormData({...formData, theme: e.target.value})}
            style={inputStyle}
          >
            {themes.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
          Subtitle *
        </label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
          placeholder="Up to 50% Off Selected Items"
          style={inputStyle}
          required
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
            Call-to-Action *
          </label>
          <input
            type="text"
            value={formData.cta}
            onChange={(e) => setFormData({...formData, cta: e.target.value})}
            placeholder="Shop Now"
            style={inputStyle}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
            Action Type
          </label>
          <select
            value={formData.action}
            onChange={(e) => setFormData({...formData, action: e.target.value})}
            style={inputStyle}
          >
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
          Action Data
        </label>
        <input
          type="text"
          value={formData.actionData}
          onChange={(e) => setFormData({...formData, actionData: e.target.value})}
          placeholder={
            formData.action === 'collection' ? 'collection-handle' :
            formData.action === 'external' ? 'https://example.com' :
            'product-id'
          }
          style={inputStyle}
        />
      </div>
      
      <button
        type="submit"
        style={{
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        ➕ Add Banner
      </button>
    </form>
  );
} 