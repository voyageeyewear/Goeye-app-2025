const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
let testUserId = null;
let testStoryId = null;

async function testStoriesAPI() {
  console.log('🧪 Testing Stories Backend API...\n');

  try {
    // 1. Create a test user
    console.log('1️⃣ Creating test user...');
    const userResponse = await axios.post(`${BASE_URL}/users`, {
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    
    testUserId = userResponse.data.data.id;
    console.log('✅ User created:', testUserId);

    // 2. Create a story
    console.log('\n2️⃣ Creating test story...');
    const storyResponse = await axios.post(`${BASE_URL}/stories`, {
      userId: testUserId,
      title: 'My Test Story',
      description: 'This is a test story for the backend'
    });
    
    testStoryId = storyResponse.data.data.storyId;
    console.log('✅ Story created:', testStoryId);

    // 3. Get all stories
    console.log('\n3️⃣ Fetching all stories...');
    const storiesResponse = await axios.get(`${BASE_URL}/stories`);
    console.log('✅ Stories fetched:', storiesResponse.data.data.stories.length, 'stories found');

    // 4. Get single story
    console.log('\n4️⃣ Fetching single story...');
    const singleStoryResponse = await axios.get(`${BASE_URL}/stories/${testStoryId}`);
    console.log('✅ Single story fetched:', singleStoryResponse.data.data.title);

    // 5. Get users
    console.log('\n5️⃣ Fetching users...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    console.log('✅ Users fetched:', usersResponse.data.data.length, 'users found');

    console.log('\n🎉 All tests passed! Backend is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log(`   - User ID: ${testUserId}`);
    console.log(`   - Story ID: ${testStoryId}`);
    console.log(`   - Total Stories: ${storiesResponse.data.data.stories.length}`);
    console.log(`   - Total Users: ${usersResponse.data.data.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testStoriesAPI();
