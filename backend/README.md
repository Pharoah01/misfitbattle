# CSSBattle Backend API

Production-ready Django REST Framework backend for a CSSBattle-style coding competition platform.

## Features

- JWT Authentication with custom User model
- Challenge CRUD with admin-only permissions
- Submission system with code sanitization (bleach)
- Real-time leaderboard with optimized queries
- PostgreSQL database with connection pooling
- CORS enabled for React frontend
- Production-ready security measures
- Scalable for 1000+ concurrent users

## Tech Stack

- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL 14+
- JWT Authentication (djangorestframework-simplejwt)
- Gunicorn WSGI Server

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Set a secure SECRET_KEY
- Configure PostgreSQL database credentials
- Set ALLOWED_HOSTS for production
- Set FRONTEND_URL for CORS

### 3. Database Setup

Create PostgreSQL database:

```bash
createdb cssbattle
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

### 5. Run Development Server

```bash
python manage.py runserver
```

### 6. Run Production Server

```bash
gunicorn -c gunicorn.conf.py backend.wsgi:application
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/token/refresh/` - Refresh access token

### Challenges
- `GET /api/challenges/` - List all challenges
- `GET /api/challenges/{id}/` - Get challenge details
- `POST /api/challenges/` - Create challenge (admin only)
- `PUT /api/challenges/{id}/` - Update challenge (admin only)
- `DELETE /api/challenges/{id}/` - Delete challenge (admin only)

### Submissions
- `POST /api/submissions/` - Submit solution
- `GET /api/submissions/` - Get user's submissions
- `GET /api/submissions/{id}/` - Get submission details
- `GET /api/submissions/all/` - Get all submissions (admin only)
- `GET /api/submissions/challenge/{id}/` - Get submissions by challenge (admin only)
- `GET /api/submissions/user/{id}/` - Get submissions by user (admin only)

### Leaderboard
- `GET /api/leaderboard/` - Get global leaderboard

## Security Features

- JWT token authentication
- Password hashing with Django's default hasher
- Code sanitization using bleach (removes script tags, event handlers)
- CORS configuration for frontend integration
- HTTPS enforcement in production
- Secure cookie flags
- Input validation and size limits
- SQL injection prevention via Django ORM

## Performance Optimizations

- PostgreSQL connection pooling (CONN_MAX_AGE=600)
- Database indexes on frequently queried fields
- select_related() and prefetch_related() for query optimization
- Optimized leaderboard calculation algorithm

## Admin Panel

Access the admin panel at `/admin/` with superuser credentials.

Features:
- User management
- Challenge CRUD operations
- Submission monitoring
- Django Jazzmin UI

## Testing

Run tests:

```bash
python manage.py test
```

## Production Deployment

1. Set DEBUG=False in .env
2. Configure ALLOWED_HOSTS
3. Set up PostgreSQL database
4. Collect static files: `python manage.py collectstatic`
5. Run with Gunicorn: `gunicorn -c gunicorn.conf.py backend.wsgi:application`
6. Use nginx as reverse proxy
7. Set up SSL certificate

## License

MIT
