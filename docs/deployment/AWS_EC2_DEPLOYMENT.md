# AWS EC2 Backend Deployment Guide
# Misfits-Battle Django Backend + Celery + Redis

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────────────────┐
│   Netlify       │         │      AWS EC2 Instance        │
│   (Frontend)    │────────▶│                              │
│   Static Files  │  HTTPS  │  ┌────────────────────────┐  │
└─────────────────┘         │  │   Nginx (Port 80/443)  │  │
                            │  └───────────┬──────────────┘  │
                            │              │                 │
                            │  ┌───────────▼──────────────┐  │
                            │  │  Gunicorn (Port 8000)    │  │
                            │  │  Django Application      │  │
                            │  └───────────┬──────────────┘  │
                            │              │                 │
                            │  ┌───────────▼──────────────┐  │
                            │  │  PostgreSQL/SQLite       │  │
                            │  │  Database                │  │
                            │  └──────────────────────────┘  │
                            │                              │
                            │  ┌──────────────────────────┐  │
                            │  │  Redis (Port 6379)       │  │
                            │  └───────────┬──────────────┘  │
                            │              │                 │
                            │  ┌───────────▼──────────────┐  │
                            │  │  Celery Worker           │  │
                            │  │  (Async Tasks)           │  │
                            │  └──────────────────────────┘  │
                            └──────────────────────────────┘
```

---

## Part 1: AWS EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Choose AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)

3. **Instance Type**: 
   - Development: `t2.micro` (Free tier - 1GB RAM)
   - Production: `t2.small` or `t2.medium` (2-4GB RAM recommended)

4. **Key Pair**: Create or select existing key pair (download .pem file)

5. **Network Settings**:
   - Create security group with these rules:
   ```
   Type            Protocol    Port Range    Source
   SSH             TCP         22            Your IP (or 0.0.0.0/0)
   HTTP            TCP         80            0.0.0.0/0
   HTTPS           TCP         443           0.0.0.0/0
   Custom TCP      TCP         8000          0.0.0.0/0 (temporary, remove later)
   ```

6. **Storage**: 20GB gp3 (Free tier: 30GB)

7. **Launch Instance**

### Step 2: Connect to EC2 Instance

```bash
# Set permissions for key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Example:
# ssh -i misfits-battle.pem ubuntu@54.123.45.67
```

---

## Part 2: Server Setup

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Python and Dependencies

```bash
# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install system dependencies
sudo apt install -y build-essential libpq-dev python3-dev
sudo apt install -y nginx redis-server postgresql postgresql-contrib

# Install Playwright dependencies (for HTML rendering)
sudo apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2
```

### Step 3: Install and Configure PostgreSQL (Optional - Recommended for Production)

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE misfits_battle;
CREATE USER misfits_user WITH PASSWORD 'your_secure_password';
ALTER ROLE misfits_user SET client_encoding TO 'utf8';
ALTER ROLE misfits_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE misfits_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE misfits_battle TO misfits_user;
\q
```

**For SQLite (Development)**: Skip PostgreSQL setup, Django will use SQLite by default.

### Step 4: Configure Redis

```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

---

## Part 3: Deploy Django Application

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/misfits-battle
sudo chown ubuntu:ubuntu /var/www/misfits-battle
cd /var/www/misfits-battle

# Clone your repository
git clone https://github.com/yourusername/misfits-battle.git .

# Or upload files via SCP:
# scp -i your-key.pem -r ./backend ubuntu@your-ec2-ip:/var/www/misfits-battle/
```

### Step 2: Setup Python Virtual Environment

```bash
cd /var/www/misfits-battle/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### Step 3: Configure Environment Variables

```bash
# Create production .env file
nano /var/www/misfits-battle/backend/.env
```

**Add the following** (update values):

```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here-generate-new-one
DEBUG=False
ALLOWED_HOSTS=your-ec2-public-ip,your-domain.com

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=misfits_battle
DB_USER=misfits_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# For SQLite (Development):
# DB_ENGINE=django.db.backends.sqlite3
# DB_NAME=db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS (Add your Netlify domain)
CORS_ALLOWED_ORIGINS=https://your-site.netlify.app,https://yourdomain.com

# Media Files
MEDIA_ROOT=/var/www/misfits-battle/backend/media
MEDIA_URL=/media/

# Static Files
STATIC_ROOT=/var/www/misfits-battle/backend/staticfiles
STATIC_URL=/static/
```

**Generate SECRET_KEY**:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 4: Update Django Settings for Production

```bash
nano /var/www/misfits-battle/backend/backend/settings.py
```

**Add/Update these settings**:

```python
import os
from pathlib import Path

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True

# Static files
STATIC_ROOT = os.getenv('STATIC_ROOT', BASE_DIR / 'staticfiles')
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = os.getenv('MEDIA_ROOT', BASE_DIR / 'media')
MEDIA_URL = '/media/'

# Security Settings (Production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
```

### Step 5: Run Migrations and Collect Static Files

```bash
cd /var/www/misfits-battle/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Generate challenge slugs (if needed)
python generate_slugs.py
```

### Step 6: Test Django with Gunicorn

```bash
# Install Gunicorn (should already be in requirements.txt)
pip install gunicorn

# Test Gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:8000

# Test in browser: http://your-ec2-ip:8000
# Press Ctrl+C to stop
```

---

## Part 4: Configure Gunicorn as System Service

### Create Gunicorn Service File

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

**Add the following**:

```ini
[Unit]
Description=Gunicorn daemon for Misfits-Battle Django
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/misfits-battle/backend
Environment="PATH=/var/www/misfits-battle/backend/venv/bin"
EnvironmentFile=/var/www/misfits-battle/backend/.env
ExecStart=/var/www/misfits-battle/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/var/www/misfits-battle/backend/gunicorn.sock \
    --timeout 120 \
    backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

**Start and Enable Gunicorn**:

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

# Check status
sudo systemctl status gunicorn

# View logs if issues
sudo journalctl -u gunicorn -f
```

---

## Part 5: Configure Celery Worker

### Create Celery Service File

```bash
sudo nano /etc/systemd/system/celery.service
```

**Add the following**:

```ini
[Unit]
Description=Celery Worker for Misfits-Battle
After=network.target redis-server.service

[Service]
Type=forking
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/misfits-battle/backend
Environment="PATH=/var/www/misfits-battle/backend/venv/bin"
EnvironmentFile=/var/www/misfits-battle/backend/.env
ExecStart=/var/www/misfits-battle/backend/venv/bin/celery -A backend worker \
    --loglevel=info \
    --logfile=/var/log/celery/worker.log \
    --pidfile=/var/run/celery/worker.pid

[Install]
WantedBy=multi-user.target
```

**Create log and pid directories**:

```bash
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown ubuntu:www-data /var/log/celery /var/run/celery
```

**Start and Enable Celery**:

```bash
sudo systemctl start celery
sudo systemctl enable celery

# Check status
sudo systemctl status celery

# View logs
sudo tail -f /var/log/celery/worker.log
```

---

## Part 6: Configure Nginx

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/misfits-battle
```

**Add the following**:

```nginx
server {
    listen 80;
    server_name your-ec2-public-ip your-domain.com;

    client_max_body_size 10M;

    # Static files
    location /static/ {
        alias /var/www/misfits-battle/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/misfits-battle/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Django application
    location / {
        proxy_pass http://unix:/var/www/misfits-battle/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Enable the site**:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/misfits-battle /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Part 7: Setup SSL with Let's Encrypt (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically update your Nginx config for HTTPS.**

---

## Part 8: Connect Frontend to Backend

### Update Netlify Environment Variable

1. Go to Netlify Dashboard → Your Site → Site settings → Environment variables
2. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://yourdomain.com
   # or
   VITE_API_URL=http://your-ec2-public-ip
   ```
3. Redeploy frontend

### Update Backend CORS

Already configured in `.env`:
```bash
CORS_ALLOWED_ORIGINS=https://your-site.netlify.app,https://yourdomain.com
```

---

## Part 9: Post-Deployment Checklist

### Test Backend Endpoints

```bash
# Health check
curl http://your-ec2-ip/api/

# Admin panel
# Visit: http://your-ec2-ip/admin/
```

### Test Full Flow

1. ✅ Frontend loads on Netlify
2. ✅ User registration works
3. ✅ User login works
4. ✅ Profile completion works
5. ✅ Challenges load
6. ✅ Code submission works
7. ✅ Celery processes submissions

### Monitor Services

```bash
# Check all services
sudo systemctl status gunicorn
sudo systemctl status celery
sudo systemctl status nginx
sudo systemctl status redis-server

# View logs
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/celery/worker.log
sudo tail -f /var/log/nginx/error.log
```

---

## Part 10: Maintenance Commands

### Update Application

```bash
cd /var/www/misfits-battle
git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

sudo systemctl restart gunicorn
sudo systemctl restart celery
```

### Backup Database

```bash
# PostgreSQL
sudo -u postgres pg_dump misfits_battle > backup_$(date +%Y%m%d).sql

# SQLite
cp /var/www/misfits-battle/backend/db.sqlite3 backup_$(date +%Y%m%d).sqlite3
```

### View Logs

```bash
# Gunicorn logs
sudo journalctl -u gunicorn --since today

# Celery logs
sudo tail -f /var/log/celery/worker.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart nginx
```

---

## Troubleshooting

### Gunicorn won't start
```bash
# Check logs
sudo journalctl -u gunicorn -n 50

# Common issues:
# 1. Permission issues → Check file ownership
# 2. Python path issues → Verify venv path
# 3. Port conflicts → Check if port 8000 is in use
```

### Celery not processing tasks
```bash
# Check Redis connection
redis-cli ping

# Check Celery logs
sudo tail -f /var/log/celery/worker.log

# Restart Celery
sudo systemctl restart celery
```

### 502 Bad Gateway
```bash
# Check Gunicorn socket
ls -la /var/www/misfits-battle/backend/gunicorn.sock

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart gunicorn nginx
```

### CORS Errors
```bash
# Verify CORS_ALLOWED_ORIGINS in .env
# Restart Gunicorn after changes
sudo systemctl restart gunicorn
```

---

## Cost Estimation

### AWS EC2 Costs
- **t2.micro** (Free tier): $0/month for 12 months, then ~$8/month
- **t2.small**: ~$17/month
- **t2.medium**: ~$34/month

### Additional Costs
- **Elastic IP**: Free if attached to running instance
- **Data Transfer**: First 100GB free/month
- **Storage**: 30GB free tier, then $0.10/GB/month

### Netlify (Frontend)
- **Free tier**: 100GB bandwidth, 300 build minutes
- **Cost**: $0/month for most college projects

**Total Estimated Cost**: $0-$17/month (depending on instance type)

---

## Security Best Practices

1. ✅ Change default SSH port (optional)
2. ✅ Use SSH keys only (disable password auth)
3. ✅ Enable UFW firewall
4. ✅ Keep system updated
5. ✅ Use strong SECRET_KEY
6. ✅ Enable HTTPS with Let's Encrypt
7. ✅ Regular backups
8. ✅ Monitor logs for suspicious activity

---

## Quick Reference Commands

```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Restart all services
sudo systemctl restart gunicorn celery nginx

# View all logs
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/celery/worker.log
sudo tail -f /var/log/nginx/error.log

# Update application
cd /var/www/misfits-battle && git pull
cd backend && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn celery
```

---

**Deployment Complete!** 🚀

Your architecture:
- **Frontend**: Netlify (CDN, HTTPS, Free)
- **Backend**: AWS EC2 (Django, Celery, Redis)
- **Database**: PostgreSQL/SQLite
- **SSL**: Let's Encrypt (Free)
