# DSAForge Backend - Authentication API

A secure Node.js + Express backend API with JWT authentication and MongoDB integration for the DSAForge platform.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

**Required Environment Variables:**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing (use a strong random string in production)
- `JWT_EXPIRE` - Token expiration time (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Authentication Routes

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "college": "IIT Delhi",
  "year": "3rd Year"
}

Response: {
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "J",
    "college": "IIT Delhi",
    "year": "3rd Year"
  }
}
```

#### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### 3. Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "success": true,
  "user": { ... }
}
```

#### 4. Update User Profile (Protected)
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "leetcode": "john_codes",
  "college": "IIT Bombay",
  "year": "4th Year",
  "phone": "+91-9876543210"
}

Response: {
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

#### 5. Change Password (Protected)
```
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}

Response: {
  "success": true,
  "message": "Password changed successfully"
}
```

#### 6. Verify Token (Protected)
```
POST /api/auth/verify-token
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Token is valid",
  "user": { ... }
}
```

#### 7. Logout (Protected)
```
POST /api/auth/logout
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Logout successful"
}
```

#### 8. Health Check
```
GET /health

Response: {
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-06-20T10:30:00.000Z"
}
```

## MongoDB Setup

### Local MongoDB
If running MongoDB locally, ensure it's running on `mongodb://localhost:27017`

### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string and update in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dsaforge?retryWrites=true&w=majority
   ```

## User Schema

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String,
  leetcode: String,
  college: String,
  year: String (enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate']),
  phone: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

✅ **Password Hashing** - bcryptjs with salt rounds = 10  
✅ **JWT Authentication** - Stateless token-based auth  
✅ **CORS Protection** - Configured for frontend URL  
✅ **Input Validation** - Express-validator for all inputs  
✅ **Protected Routes** - Authentication middleware on sensitive endpoints  
✅ **Error Handling** - Comprehensive error responses  

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get Current User (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Frontend Integration

Update your frontend to use these APIs instead of mock authentication. Example:

```javascript
// src/context/AppContext.js
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    // Update user state
  }
};
```

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT creation and verification
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **express-validator** - Input validation
- **nodemon** - Development auto-reload

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access in MongoDB Atlas (if cloud)

### Token Expired Error
- Get a new token by logging in again
- Increase `JWT_EXPIRE` in `.env` if needed

### CORS Error
- Update `FRONTEND_URL` in `.env` to match your frontend URL

## Production Checklist

- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Enable HTTPS for all API calls
- [ ] Use MongoDB Atlas with strong credentials
- [ ] Set `NODE_ENV=production`
- [ ] Use rate limiting middleware
- [ ] Add logging service
- [ ] Set up monitoring and alerts
- [ ] Use environment-specific configuration

## License

MIT
