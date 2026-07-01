# DSAForge Backend Setup Guide

## Quick Start

### Step 1: Initialize Backend
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and set:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Any random string (change in production)

### Step 3: Start Backend Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
📝 API Documentation:
   POST   /api/auth/register - Register new user
   POST   /api/auth/login - Login user
   GET    /api/auth/me - Get current user (protected)
   PUT    /api/auth/profile - Update profile (protected)
   ...
```

### Step 4: Update Frontend

Add to your frontend `package.json`:
```json
{
  "proxy": "http://localhost:5000"
}
```

Or create `.env` in the frontend root:
```
REACT_APP_API_URL=http://localhost:5000
```

### Step 5: Use API Client

Copy the provided `FRONTEND_API_CLIENT.js` to `src/services/api.js` and use it in your React components:

```javascript
import api from './services/api';

// Register
const response = await api.register(name, email, password, college, year);
localStorage.setItem('authToken', response.token);

// Login
const response = await api.login(email, password);
localStorage.setItem('authToken', response.token);

// Get current user
const user = await api.getCurrentUser();

// Logout
await api.logout();
localStorage.removeItem('authToken');
```

## MongoDB Setup

### Option 1: Local MongoDB (Development)
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string in .env
MONGODB_URI=mongodb://localhost:27017/dsaforge
```

### Option 2: MongoDB Atlas (Cloud)
1. Visit https://cloud.mongodb.com
2. Create a free account
3. Create a project and cluster
4. Go to "Database" → "Connect" → "Drivers"
5. Copy connection string and update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dsaforge?retryWrites=true&w=majority
   ```

## API Endpoints Summary

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| POST | `/api/auth/change-password` | ✅ | Change password |
| POST | `/api/auth/verify-token` | ✅ | Verify token |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/health` | ❌ | Health check |

## Testing APIs

### Using Postman/Insomnia
1. Import the collection (see examples in backend/README.md)
2. Set authorization header: `Authorization: Bearer <token>`
3. Test endpoints

### Using cURL
```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
```

## Running Both Frontend & Backend

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
npm start
```

Frontend will be available at: `http://localhost:3000`
Backend API at: `http://localhost:5000`

## Project Structure

```
DSAForge-Complete/
├── backend/                    # NEW: Express.js backend
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Auth logic
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/
│   │   └── User.js            # User schema
│   ├── routes/
│   │   └── authRoutes.js      # Auth endpoints
│   ├── server.js              # Main server file
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── README.md              # API documentation
│
├── src/                        # React frontend
│   ├── pages/
│   │   └── AuthPage.js        # Update to use real API
│   ├── services/
│   │   └── api.js             # NEW: API client (from FRONTEND_API_CLIENT.js)
│   └── ...
└── package.json
```

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**MongoDB connection error:**
- Check MongoDB is running: `brew services list`
- Verify connection string in `.env`
- Ensure IP is whitelisted (if using Atlas)

**CORS errors:**
- Backend default CORS: `http://localhost:3000`
- Change in `backend/server.js` if needed

**Token authentication fails:**
- Ensure `Authorization: Bearer <token>` header is included
- Check token hasn't expired (default: 7 days)

## Next Steps

1. ✅ Backend created
2. ⬜ Update AuthPage.js to use real API
3. ⬜ Update AppContext.js for real authentication
4. ⬜ Add protected routes in frontend
5. ⬜ Implement logout functionality
6. ⬜ Add user session persistence
