# Quick Start Guide

Get the CSSBattle backend running in 5 minutes!

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- pip

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Set Up Database

Create a PostgreSQL database:

```bash
# Using psql
createdb cssbattle

# Or using PostgreSQL command line
psql -U postgres
CREATE DATABASE cssbattle;
\q
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - SECRET_KEY (generate a secure random string)
# - DB_NAME=cssbattle
# - DB_USER=your_postgres_user
# - DB_PASSWORD=your_postgres_password
```

## Step 4: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Step 5: Create Admin User

```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

## Step 6: Start Server

### Development
```bash
python manage.py runserver
```

### Production
```bash
gunicorn -c gunicorn.conf.py backend.wsgi:application
```

## Step 7: Test the API

### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "TEST001",
    "name": "Test User",
    "password": "testpass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "TEST001",
    "password": "testpass123"
  }'
```

Save the `access` token from the response.

### Create a Challenge (Admin Only)
```bash
curl -X POST http://localhost:8000/api/challenges/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Simple Box",
    "description": "Create a red box",
    "html_boilerplate": "<div></div>",
    "css_boilerplate": "body { margin: 0; }",
    "points": 100
  }'
```

### Submit a Solution
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

### View Leaderboard
```bash
curl -X GET http://localhost:8000/api/leaderboard/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Access Admin Panel

Navigate to: `http://localhost:8000/admin/`

Login with your superuser credentials.

## Common Issues

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify database credentials in `.env`
- Ensure database exists: `psql -l`

### Import Errors
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.10+)

### Migration Errors
- Delete migration files (except `__init__.py`) and re-run `makemigrations`
- Drop and recreate database if needed

### CORS Errors
- Check `FRONTEND_URL` in `.env`
- Ensure `corsheaders` is in `INSTALLED_APPS`
- Verify `CorsMiddleware` is in `MIDDLEWARE`

## Next Steps

1. Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference
2. Read [README.md](README.md) for detailed setup and deployment
3. Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture details

## Support

For issues or questions, check the documentation files or create an issue in the repository.

Happy coding! 🚀
