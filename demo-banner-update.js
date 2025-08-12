#!/usr/bin/env node

/**
 * Demo Script: Banner Configuration Live Updates
 * 
 * This script demonstrates how to update banner configurations
 * in real-time using the live rendering system.
 */

const API_BASE = 'http://localhost:3000/api';

async function updateBannerConfig() {
  console.log('🎯 Demo: Testing Banner Configuration Live Updates\n');

  // Test 1: Add a new promotional banner
  console.log('1️⃣ Adding a new promotional banner...');
  
  const newBanner = {
    title: '🔥 LIMITED TIME!',
    subtitle: 'Extra 30% Off Everything',
    cta: 'Grab Deal',
    theme: 'red',
    action: 'external',
    actionData: 'https://example.com/sale'
  };

  const formData = new FormData();
  formData.append('action', 'add_banner');
  formData.append('banner', JSON.stringify(newBanner));

  try {
    const response = await fetch(`${API_BASE}/banner-config`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('✅ New banner added:', result.message);
    console.log('📊 Total banners:', result.banners.banners.length);
  } catch (error) {
    console.error('❌ Error adding banner:', error.message);
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Update existing banner configuration
  console.log('\n2️⃣ Updating banner themes...');
  
  const updatedBanners = {
    enabled: true,
    banners: [
      {
        id: 'banner_1',
        title: '🚀 MEGA SALE!',
        subtitle: 'Up to 70% Off Selected Items',
        cta: 'Shop Now',
        theme: 'purple',
        action: 'collection',
        actionData: 'sale-items',
        enabled: true
      },
      {
        id: 'banner_2',
        title: '✨ Spring Collection',
        subtitle: 'Fresh looks for the new season',
        cta: 'Discover',
        theme: 'green',
        action: 'collection',
        actionData: 'spring-collection',
        enabled: true
      }
    ]
  };

  const updateFormData = new FormData();
  updateFormData.append('action', 'update_banners');
  updateFormData.append('banners', JSON.stringify(updatedBanners));

  try {
    const response = await fetch(`${API_BASE}/banner-config`, {
      method: 'POST',
      body: updateFormData
    });
    
    const result = await response.json();
    console.log('✅ Banner configuration updated:', result.message);
  } catch (error) {
    console.error('❌ Error updating banners:', error.message);
  }

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Toggle banner visibility
  console.log('\n3️⃣ Toggling banner visibility...');
  
  const toggleFormData = new FormData();
  toggleFormData.append('action', 'toggle_banner');
  toggleFormData.append('bannerId', 'banner_2');
  toggleFormData.append('enabled', 'false');

  try {
    const response = await fetch(`${API_BASE}/banner-config`, {
      method: 'POST',
      body: toggleFormData
    });
    
    const result = await response.json();
    console.log('✅ Banner visibility toggled:', result.message);
  } catch (error) {
    console.error('❌ Error toggling banner:', error.message);
  }

  console.log('\n🎉 Demo completed! Check your mobile app to see the real-time changes.');
  console.log('📱 Open: http://localhost:3000/mobile-app.html');
  console.log('👁️  Navigate to "All Products" to see banners after every 4 products');
}

// Run the demo
updateBannerConfig().catch(console.error); 