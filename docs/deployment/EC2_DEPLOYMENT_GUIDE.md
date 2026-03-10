# EC2 Deployment Guide - 70 Users

Complete guide for deploying Misfits-Battle backend on AWS EC2 with PostgreSQL.

---

## Recommended Instance Configuration

### For 70 Concurrent Users

**Instance Type:** `t3.small` or `t3a.small`

| Specification | t3.small | t3a.small (AMD) |
|---------------|----------|-----------------|
| vCPUs | 2 | 2 |
| RAM | 2 GB | 2 GB |
| Network | Up to 5 Gbps | Up to 5 Gbps |
| Cost/Month | ~$15 | ~$13 |
| Burst Credits | Yes | Yes |

**Why t3.small for 70 users?**
- 70 users = ~3-4 requests/second peak load
- 2 GB RAM sufficient for Django + PostgreSQL + Redis + Celery
- Burstable performance handles traffic spikes
- Cost-effective for small competitions

**Storage:** 30 GB GP3 SSD
- **Type:** GP3 (General Purpose SSD v3)
- **Size:** 30 GB
- **IOPS:** 3,000 (baseline)
- **Throughput:** 125 MB/s (baseline)
- **Cost:** ~$2.40/month

**Total Monthly Cost:** ~$15-17

---

## Step-by-Step Deployment

### Phase 1: Launch EC2 Instance

#### 1.1 Create EC2 Instance

1. **Login to AWS Console** → EC2 Dashboard

2. **Click "Launch Instance"**

3. **Configure Instance:**

```
Name: misfits-battle-backend
```

4. **Choose AMI:**
```
Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
Architecture: 64-bit (x86)
```

5. **Choose Instance Type:**
```
t3.small (2 vCPU, 2 GB RAM)
```

6. **Key Pair:**
```
Create new key pair:
  Name: misfits-battle-key
  Type: RSA
  Format: .pem (for Linux/Mac) or .ppk (for Windows/PuTTY)
  
Download and save securely!
```

7. **Network Settings:**
```
VPC: Default VPC
Subnet: No preference (default)
Auto-assign public IP: Enable
```

8. **Firewall (Security Group):**
```
Create new security group:
  Name: misfits-battle-sg
  Description: Security group for Misfits Battle backend
  
Inbound Rules:
  1. SSH (Port 22) - Your IP only
  2. HTTP (Port 80) - Anywhere (0.0.0.0/0)
  3. HTTPS (Port 443) - Anywhere (0.0.0.0/0)
  4. Custom TCP (Port 8000) - Anywhere (0.0.0.0/0) [for testing]
```

9. **Configure Storage:**
```
Volume 1 (Root):
  Size: 30 GB
  Volume Type: gp3
  IOPS: 3000
  Throughput: 125 MB/s
  Delete on Termination: Yes
  Encrypted: No (optional: enable for security)
```

10. **Advanced Details:**
```
Leave defaults
```

11. **Click "Launch Instance"**

#### 1.2 Connect to Instance

```bash
# Set key permissions (Linux/Mac)
chmod 400 misfits-battle-key.pem

# Connect via SSH
ssh -i misfits-battle-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

**Windows (PuTTY):**
1. Convert .pem to .ppk using PuTTYgen
2. Use PuTTY with .ppk key

---

### Phase 2: Initial Server Setup

#### 2.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2.2 Install Required Packages

```bash
# Python and build tools
sudo apt install -y python3.10 python3.10-venv python3-pip python3-dev

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Redis
sudo apt install -y redis-server

# Nginx
sudo apt install -y nginx

# System utilities
sudo apt install -y git curl wget htop

# Playwright dependencies (for rendering)
sudo apt install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2
```

---

### Phase 3: PostgreSQL Setup

#### 3.1 Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE misfits_battle;
CREATE USER misfits_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE misfits_user SET client_encoding TO 'utf8';
ALTER ROLE misfits_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE misfits_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE misfits_battle TO misfits_user;

# Exit PostgreSQL
\q
```

#### 3.2 Tune PostgreSQL for 2GB RAM

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Add/Update these settings:**

```conf
# Memory Settings (for 2GB RAM)
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
work_mem = 8MB

# Connection Settings
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# Write Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

**Restart PostgreSQL:**

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

---

### Phase 4: Redis Setup

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf
```

**Update settings:**

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""  # Disable persistence for speed
```

**Restart Redis:**

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

### Phase 5: Deploy Backend Application

#### 5.1 Create Application User

```bash
# Create deploy user
sudo adduser --disabled-password --gecos "" deploy

# Add to sudo group (optional)
sudo usermod -aG sudo deploy

# Switch to deploy user
sudo su - deploy
```

#### 5.2 Clone Repository

```bash
# Create app directory
mkdir -p /home/deploy/misfits-battle
cd /home/deploy/misfits-battle

# Clone your repository
git clone https://github.com/your-username/MisfitsBattle.git .

# Or upload files via SCP/SFTP
```

#### 5.3 Setup Python Environment

```bash
cd /home/deploy/misfits-battle/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

#### 5.4 Configure Environment

```bash
# Create .env file
nano .env
```

**Production .env:**

```env
# Django Settings
SECRET_KEY=your-super-secret-key-generate-new-one
DEBUG=False
ALLOWED_HOSTS=your-ec2-ip,yourdomain.com

# Database
USE_POSTGRES=True
DB_NAME=misfits_battle
DB_USER=misfits_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Redis & Celery
USE_CELERY=True
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://your-netlify-domain.netlify.app,https://yourdomain.com

# Media & Static
MEDIA_ROOT=/home/deploy/misfits-battle/backend/media
MEDIA_URL=/media/
STATIC_ROOT=/home/deploy/misfits-battle/backend/staticfiles
STATIC_URL=/static/
```

**Generate SECRET_KEY:**

```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

#### 5.5 Run Migrations

```bash
# Activate venv
source venv/bin/activate

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

---

### Phase 6: Setup Gunicorn

#### 6.1 Test Gunicorn

```bash
# Test Gunicorn manually
gunicorn -c gunicorn.conf.py backend.wsgi:application
```

#### 6.2 Create Systemd Service

```bash
# Exit deploy user
exit

# Create Gunicorn service
sudo nano /etc/systemd/system/gunicorn.service
```

**Gunicorn Service File:**

```ini
[Unit]
Description=Gunicorn daemon for Misfits Battle
After=network.target

[Service]
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/misfits-battle/backend
Environment="PATH=/home/deploy/misfits-battle/backend/venv/bin"
ExecStart=/home/deploy/misfits-battle/backend/venv/bin/gunicorn \
    --config /home/deploy/misfits-battle/backend/gunicorn.conf.py \
    backend.wsgi:application

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Start Gunicorn:**

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

---

### Phase 7: Setup Celery Worker

#### 7.1 Create Celery Service

```bash
sudo nano /etc/systemd/system/celery.service
```

**Celery Service File:**

```ini
[Unit]
Description=Celery Worker for Misfits Battle
After=network.target redis.service

[Service]
Type=forking
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/misfits-battle/backend
Environment="PATH=/home/deploy/misfits-battle/backend/venv/bin"
ExecStart=/home/deploy/misfits-battle/backend/venv/bin/celery -A backend worker \
    --loglevel=info \
    --concurrency=2 \
    --max-tasks-per-child=100 \
    --time-limit=300 \
    --detach \
    --logfile=/home/deploy/misfits-battle/backend/logs/celery.log \
    --pidfile=/home/deploy/misfits-battle/backend/celery.pid

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Create logs directory:**

```bash
sudo mkdir -p /home/deploy/misfits-battle/backend/logs
sudo chown -R deploy:deploy /home/deploy/misfits-battle/backend/logs
```

**Start Celery:**

```bash
sudo systemctl start celery
sudo systemctl enable celery
sudo systemctl status celery
```

---

### Phase 8: Configure Nginx

#### 8.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/misfits-battle
```

**Nginx Configuration:**

```nginx
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-ec2-ip yourdomain.com;
    
    client_max_body_size 10M;
    
    # Logging
    access_log /var/log/nginx/misfits-battle-access.log;
    error_log /var/log/nginx/misfits-battle-error.log;
    
    # Static files
    location /static/ {
        alias /home/deploy/misfits-battle/backend/staticfiles/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /home/deploy/misfits-battle/backend/media/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### 8.2 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/misfits-battle /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Phase 9: SSL Certificate (Optional but Recommended)

#### 9.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 9.2 Obtain Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

#### 9.3 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is enabled by default
```

---

### Phase 10: Firewall Configuration

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Verification & Testing

### 1. Check Services

```bash
# Check all services
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status gunicorn
sudo systemctl status celery
sudo systemctl status nginx
```

### 2. Test API

```bash
# Test health endpoint
curl http://your-ec2-ip/api/

# Test admin panel
curl http://your-ec2-ip/admin/
```

### 3. Monitor Logs

```bash
# Gunicorn logs
sudo journalctl -u gunicorn -f

# Celery logs
tail -f /home/deploy/misfits-battle/backend/logs/celery.log

# Nginx logs
sudo tail -f /var/log/nginx/misfits-battle-error.log
```

---

## Performance Monitoring

### Install Monitoring Tools

```bash
# Install htop
sudo apt install -y htop

# Install netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### Monitor Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Redis info
redis-cli info stats
```

---

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
nano /home/deploy/backup-db.sh
```

**Backup Script:**

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
sudo -u postgres pg_dump misfits_battle > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

**Make executable and schedule:**

```bash
chmod +x /home/deploy/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/deploy/backup-db.sh
```

### 2. Media Files Backup

```bash
# Sync to S3 (optional)
aws s3 sync /home/deploy/misfits-battle/backend/media/ s3://your-bucket/media/
```

---

## Troubleshooting

### Gunicorn Not Starting

```bash
# Check logs
sudo journalctl -u gunicorn -n 50

# Check permissions
ls -la /home/deploy/misfits-battle/backend/

# Restart
sudo systemctl restart gunicorn
```

### Celery Not Processing

```bash
# Check Celery logs
tail -f /home/deploy/misfits-battle/backend/logs/celery.log

# Check Redis
redis-cli ping

# Restart Celery
sudo systemctl restart celery
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d misfits_battle -c "SELECT 1;"

# Check pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart services
sudo systemctl restart gunicorn celery
```

---

## Scaling Considerations

### If You Need More Capacity

**Upgrade to t3.medium:**
- 2 vCPUs → 4 vCPUs
- 2 GB RAM → 4 GB RAM
- Cost: +$15/month
- Supports 150+ users

**Steps to Upgrade:**
1. Stop instance
2. Change instance type to t3.medium
3. Start instance
4. Update Gunicorn workers: 4 → 6
5. Update Celery workers: 2 → 4

---

## Cost Summary

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| EC2 Instance | t3.small | $15 |
| EBS Storage | 30 GB GP3 | $2.40 |
| Data Transfer | 50 GB/month | $4.50 |
| **Total** | | **~$22/month** |

**Annual Cost:** ~$264

---

## Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall (UFW) enabled
- [ ] PostgreSQL password authentication
- [ ] Django DEBUG=False
- [ ] Strong SECRET_KEY
- [ ] HTTPS enabled (SSL certificate)
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Restricted security group rules
- [ ] Non-root user for application

---

## Maintenance Schedule

**Daily:**
- Monitor logs for errors
- Check disk space

**Weekly:**
- Review performance metrics
- Check backup integrity

**Monthly:**
- Update system packages
- Review security patches
- Optimize database (VACUUM)

---

## Support & Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Nginx Best Practices](https://www.nginx.com/blog/nginx-best-practices/)

---

**Deployment Complete!** 🚀

Your backend is now running on EC2 with PostgreSQL, ready to handle 70+ concurrent users.
