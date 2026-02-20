# CSSBattle Competition Platform - Project Overview

## 🎯 Project Description

A full-stack web application for hosting CSSBattle-style coding competitions. The platform allows users to participate in CSS/HTML challenges, submit solutions, and compete on a real-time leaderboard. Designed for high-traffic college events with support for 1000+ concurrent users.

## 🏗️ Architecture

### Backend (Django REST Framework)
- **Framework**: Django 4.2.7 + Django REST Framework 3.14.0
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **API Style**: RESTful API with JSON responses

### Frontend (To Be Implemented)
- **Framework**: React (recommended)
- **State Management**: Context API / Redux
- **HTTP Client**: Axios
- **Styling**: CSS/Tailwind CSS

## ✨ Implemented Backend Features

### 1. User Authentication System
**Endpoints:**
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login with JWT tokens
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user info
- `POST /api/auth/token/refresh/` - Refresh access token

**Features:**
- Custom User model with `register_number` as username
- JWT authentication with access and refresh tokens
- Password hashing and validation
- Admin flag for privileged users

### 2. Challenge Management
**Endpoints:**
- `GET /api/challenges/` - List all challenges
- `GET /api/challenges/{id}/` - Get challenge details
- `POST /api/challenges/` - Create challenge (admin only)
- `PUT /api/challenges/{id}/` - Update challenge (admin only)
- `DELETE /api/challenges/{id}/` - Delete challenge (admin only)

**Features:**
- Challenge CRUD operations
- HTML/CSS boilerplate templates
- Points system
- Admin-only write permissions

### 3. Submission System
**Endpoints:**
- `POST /api/submissions/` - Submit solution
- `GET /api/submissions/` - Get user's submissions
- `GET /api/submissions/{id}/` - Get submission details
- `GET /api/submissions/all/` - Get all submissions (admin)
- `GET /api/submissions/challenge/{id}/` - Filter by challenge (admin)
- `GET /api/submissions/user/{id}/` - Filter by user (admin)

**Features:**
- Code sanitization using bleach library
- Removes script tags, event handlers, javascript: URLs
- Auto-calculates code length
- Prevents XSS attacks
- 10,000 character limit per submission

### 4. Leaderboard System
**Endpoints:**
- `GET /api/leaderboard/` - Get global leaderboard

**Features:**
- Real-time ranking calculation
- Sorts by total points (descending) then submission time (ascending)
- Shows: rank, register_number, name, total_points, solved_count
- Optimized database queries

### 5. Admin Panel
**Access:** `/admin/`

**Features:**
- Django Jazzmin UI for better UX
- User management
- Challenge CRUD operations
- Submission monitoring
- Filtering and search capabilities

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with Django's default hasher
- Role-based access control (admin vs regular users)
- Token expiration and refresh mechanism

### Input Validation & Sanitization
- DRF serializer validation
- Code length limits (10,000 characters)
- Alphanumeric register_number validation
- HTML/CSS sanitization with bleach library
- Removes malicious code before storage

### Security Headers (Production)
- HTTPS enforcement
- Secure cookie flags
- XSS protection
- Content type sniffing prevention
- Clickjacking protection
- HSTS (HTTP Strict Transport Security)

### CORS Configuration
- Configured for React frontend
- Environment-based origin configuration
- Proper preflight request handling

## 📊 Database Schema

### User Model
```
- id (Primary Key)
- register_number (Unique, Indexed)
- name
- password (Hashed)
- is_admin
- created_at
```

### Challenge Model
```
- id (Primary Key)
- title
- description
- html_boilerplate
- css_boilerplate
- points
- created_at
```

### Submission Model
```
- id (Primary Key)
- user_id (Foreign Key)
- challenge_id (Foreign Key)
- html_code (Sanitized)
- css_code (Sanitized)
- code_length (Auto-calculated)
- submitted_at (Indexed)
```

## 🚀 Performance Optimizations

### Database
- Connection pooling (CONN_MAX_AGE=600)
- Indexes on frequently queried fields
- select_related() and prefetch_related() for query optimization
- Efficient leaderboard aggregation queries

### Application
- Optimized leaderboard calculation algorithm
- Minimal N+1 query problems
- Efficient sorting and filtering

### Scalability
- Designed for 1000+ concurrent users
- Gunicorn WSGI server with multiple workers
- Stateless API design for horizontal scaling

## 📁 Project Structure

```
CSS-battle/
├── backend/                          # Django backend
│   ├── backend/                      # Project configuration
│   │   ├── settings.py              # Main settings
│   │   ├── urls.py                  # URL routing
│   │   └── wsgi.py                  # WSGI config
│   ├── users/                        # User authentication
│   │   ├── models.py                # Custom User model
│   │   ├── serializers.py           # User serializers
│   │   ├── views.py                 # Auth endpoints
│   │   └── admin.py                 # User admin
│   ├── challenges/                   # Challenge management
│   │   ├── models.py                # Challenge model
│   │   ├── serializers.py           # Challenge serializers
│   │   ├── views.py                 # Challenge CRUD
│   │   ├── permissions.py           # Admin permissions
│   │   └── admin.py                 # Challenge admin
│   ├── submissions/                  # Submission handling
│   │   ├── models.py                # Submission model
│   │   ├── serializers.py           # Submission serializers
│   │   ├── views.py                 # Submission endpoints
│   │   ├── sanitizer.py             # Code sanitization
│   │   ├── permissions.py           # Owner permissions
│   │   └── admin.py                 # Submission admin
│   ├── leaderboard/                  # Leaderboard system
│   │   ├── services.py              # Ranking calculation
│   │   ├── views.py                 # Leaderboard endpoint
│   │   └── urls.py                  # Leaderboard routes
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   ├── gunicorn.conf.py             # Gunicorn config
│   ├── setup.sh                      # Setup script
│   ├── README.md                     # Backend docs
│   ├── API_DOCUMENTATION.md          # API reference
│   ├── QUICKSTART.md                 # Quick start guide
│   └── IMPLEMENTATION_SUMMARY.md     # Implementation details
└── frontend/                         # React frontend (to be implemented)
```

## 🎨 Frontend Requirements (Next Phase)

### Pages to Implement
1. **Landing Page** - Welcome and login/register
2. **Login Page** - User authentication
3. **Register Page** - New user registration
4. **Dashboard** - Challenge list and user stats
5. **Challenge Page** - Challenge details and code editor
6. **Leaderboard Page** - Global rankings
7. **Profile Page** - User submissions and stats
8. **Admin Panel** - Challenge management (admin only)

### Key Components
- **Navbar** - Navigation with user info
- **Code Editor** - Split view for HTML/CSS editing
- **Live Preview** - Real-time rendering of code
- **Challenge Card** - Challenge info display
- **Leaderboard Table** - Ranked user list
- **Submission History** - User's past submissions

### Features to Implement
- JWT token management (localStorage/sessionStorage)
- Axios interceptors for authentication
- Protected routes for authenticated users
- Admin-only routes
- Real-time code preview
- Responsive design for mobile/tablet
- Loading states and error handling
- Toast notifications for user feedback

## 🔧 Setup Instructions

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup (To Be Done)
```bash
cd frontend
npm install
npm start
```

## 📝 API Usage Example

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "CS2021001",
    "name": "John Doe",
    "password": "securepass123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "CS2021001",
    "password": "securepass123"
  }'
```

### 3. Get Challenges
```bash
curl -X GET http://localhost:8000/api/challenges/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Submit Solution
```bash
curl -X POST http://localhost:8000/api/submissions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "challenge": 1,
    "html_code": "<div class=\"box\"></div>",
    "css_code": ".box { width: 100px; height: 100px; background: red; }"
  }'
```

### 5. View Leaderboard
```bash
curl -X GET http://localhost:8000/api/leaderboard/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎯 Next Steps

### Immediate (Backend)
1. ✅ User authentication system
2. ✅ Challenge CRUD operations
3. ✅ Submission system with sanitization
4. ✅ Leaderboard calculation
5. ✅ Admin panel
6. ✅ API documentation

### Next Phase (Frontend)
1. ⏳ Set up React project
2. ⏳ Implement authentication flow
3. ⏳ Create challenge listing page
4. ⏳ Build code editor with live preview
5. ⏳ Implement submission system
6. ⏳ Create leaderboard page
7. ⏳ Add admin dashboard
8. ⏳ Responsive design
9. ⏳ Testing and optimization

### Future Enhancements
- Real-time leaderboard updates (WebSockets)
- Challenge difficulty levels
- User profiles with statistics
- Challenge categories/tags
- Code comparison tool
- Social features (comments, likes)
- Email notifications
- Export submissions
- Analytics dashboard

## 📚 Documentation Files

- `README.md` - Complete project documentation
- `API_DOCUMENTATION.md` - Detailed API reference with examples
- `QUICKSTART.md` - Quick start guide for developers
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `PROJECT_OVERVIEW.md` - This file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License

---

**Status**: Backend Complete ✅ | Frontend In Progress ⏳

**Last Updated**: February 2026
