# Instagram-Style Stories Backend API

A complete backend implementation for Instagram-style stories with media upload, processing, and management capabilities.

## 🚀 Features

- **Story Management**: Create, read, update, and delete stories
- **Media Upload**: Support for multiple image and video formats
- **File Processing**: Automatic thumbnail generation and media optimization
- **Pagination**: Efficient data loading with pagination support
- **Real-time Updates**: WebSocket integration for live updates
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Local file storage with thumbnail generation

## 📋 Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   cd Eyejack-mobile-app/backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/eyejack_stories
   PORT=3001
   NODE_ENV=development
   ```

3. **Start MongoDB**
   ```bash
   # If using MongoDB locally
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

4. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Currently, the API is open for testing. In production, implement JWT authentication.

### 1. User Management

#### Create User
```http
POST /users
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "testuser",
    "email": "test@example.com",
    "profilePicture": "",
    "bio": "",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Users
```http
GET /users
```

#### Get User by ID
```http
GET /users/:id
```

### 2. Story Management

#### Create Story
```http
POST /stories
Content-Type: application/json

{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "My First Story",
  "description": "This is my first story post"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Story created successfully",
  "data": {
    "storyId": "60f7b3b3b3b3b3b3b3b3b3b4",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "My First Story",
    "description": "This is my first story post",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "media": []
  }
}
```

#### Add Media to Story
```http
POST /stories/:storyId/media
Content-Type: multipart/form-data

media: [file1, file2, file3] // Multiple files
```

**Supported Formats:**
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, mov, avi, wmv, flv, webm

**Response:**
```json
{
  "success": true,
  "message": "Media added to story successfully",
  "data": {
    "storyId": "60f7b3b3b3b3b3b3b3b3b3b4",
    "mediaCount": 3,
    "media": [
      {
        "mediaId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "type": "image",
        "url": "/uploads/stories/filename1.jpg",
        "thumbnailUrl": "/uploads/thumbnails/thumb_filename1.jpg",
        "order": 0
      },
      {
        "mediaId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "type": "video",
        "url": "/uploads/stories/filename2.mp4",
        "thumbnailUrl": "/uploads/thumbnails/thumb_filename2.jpg",
        "order": 1
      }
    ]
  }
}
```

#### Get All Stories
```http
GET /stories?page=1&limit=20&userId=60f7b3b3b3b3b3b3b3b3b3b3
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `userId`: Filter by user ID (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "storyId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "title": "My First Story",
        "description": "This is my first story post",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "expiresAt": "2024-01-16T10:30:00.000Z",
        "viewCount": 5,
        "mediaCount": 3,
        "user": {
          "username": "testuser",
          "profilePicture": ""
        },
        "media": [
          {
            "mediaId": "60f7b3b3b3b3b3b3b3b3b3b5",
            "type": "image",
            "url": "/uploads/stories/filename1.jpg",
            "thumbnailUrl": "/uploads/thumbnails/thumb_filename1.jpg",
            "order": 0
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    }
  }
}
```

#### Get Single Story
```http
GET /stories/:storyId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "storyId": "60f7b3b3b3b3b3b3b3b3b3b4",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "My First Story",
    "description": "This is my first story post",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "viewCount": 6,
    "mediaCount": 3,
    "isExpired": false,
    "user": {
      "username": "testuser",
      "profilePicture": ""
    },
    "media": [
      {
        "mediaId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "type": "image",
        "url": "/uploads/stories/filename1.jpg",
        "thumbnailUrl": "/uploads/thumbnails/thumb_filename1.jpg",
        "order": 0,
        "duration": 0
      },
      {
        "mediaId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "type": "video",
        "url": "/uploads/stories/filename2.mp4",
        "thumbnailUrl": "/uploads/thumbnails/thumb_filename2.jpg",
        "order": 1,
        "duration": 15
      }
    ]
  }
}
```

#### Delete Story
```http
DELETE /stories/:storyId
```

#### Delete Media from Story
```http
DELETE /stories/:storyId/media/:mediaId
```

## 🔧 Database Schema

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  profilePicture: String,
  bio: String,
  isActive: Boolean,
  timestamps: true
}
```

### Story Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String (required),
  description: String,
  isActive: Boolean,
  expiresAt: Date (24 hours from creation),
  viewCount: Number,
  mediaCount: Number,
  timestamps: true
}
```

### Media Model
```javascript
{
  storyId: ObjectId (ref: Story),
  type: String (enum: ['image', 'video']),
  url: String (required),
  thumbnailUrl: String,
  filename: String (required),
  originalName: String (required),
  mimeType: String (required),
  size: Number (required),
  duration: Number (for videos),
  width: Number,
  height: Number,
  order: Number,
  isActive: Boolean,
  timestamps: true
}
```

## 🔗 Frontend Integration

### 1. Fetch Stories for Display
```javascript
// Get all stories for story slider
const fetchStories = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/stories');
    const data = await response.json();
    
    if (data.success) {
      // Format for frontend story slider
      const stories = data.data.stories.map(story => ({
        storyId: story.storyId,
        userId: story.userId,
        username: story.user.profilePicture,
        profilePicture: story.user.profilePicture,
        createdAt: story.createdAt,
        media: story.media.map(media => ({
          mediaId: media.mediaId,
          type: media.type,
          url: `http://localhost:3001${media.url}`,
          thumbnailUrl: `http://localhost:3001${media.thumbnailUrl}`
        }))
      }));
      
      return stories;
    }
  } catch (error) {
    console.error('Error fetching stories:', error);
  }
};
```

### 2. Create Story with Media
```javascript
// Create a new story
const createStory = async (title, description, userId) => {
  try {
    const response = await fetch('http://localhost:3001/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        userId
      })
    });
    
    const data = await response.json();
    return data.data.storyId;
  } catch (error) {
    console.error('Error creating story:', error);
  }
};

// Add media to story
const addMediaToStory = async (storyId, files) => {
  try {
    const formData = new FormData();
    
    for (let file of files) {
      formData.append('media', file);
    }
    
    const response = await fetch(`http://localhost:3001/api/stories/${storyId}/media`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error adding media:', error);
  }
};
```

### 3. Real-time Updates
The backend includes WebSocket support for real-time updates:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Listen for story updates
socket.on('story:created', (data) => {
  console.log('New story created:', data);
  // Update your frontend story list
});

socket.on('story:updated', (data) => {
  console.log('Story updated:', data);
  // Update specific story in your frontend
});

socket.on('story:deleted', (data) => {
  console.log('Story deleted:', data);
  // Remove story from your frontend
});
```

## 🧪 Testing

### 1. Create Test User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Create Story
```bash
curl -X POST http://localhost:3001/api/stories \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_STEP_1",
    "title": "Test Story",
    "description": "This is a test story"
  }'
```

### 3. Add Media to Story
```bash
curl -X POST http://localhost:3001/api/stories/STORY_ID/media \
  -F "media=@/path/to/image.jpg" \
  -F "media=@/path/to/video.mp4"
```

### 4. Get All Stories
```bash
curl http://localhost:3001/api/stories
```

## 🚀 Production Deployment

### 1. Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eyejack_stories
JWT_SECRET=your_secure_jwt_secret
```

### 2. File Storage
For production, consider using cloud storage:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### 3. Security
- Implement JWT authentication
- Add rate limiting
- Enable CORS properly
- Use HTTPS
- Validate file uploads

### 4. Performance
- Add Redis for caching
- Implement CDN for media files
- Add database indexing
- Use compression middleware

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── storyController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Story.js
│   │   └── Media.js
│   ├── routes/
│   │   ├── stories.js
│   │   └── users.js
│   ├── services/
│   │   └── mediaService.js
│   └── realtime-server.js
├── uploads/
│   ├── stories/
│   └── thumbnails/
├── package.json
└── README_STORIES.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the example responses

---

**Happy Coding! 🎉**
