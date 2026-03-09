# Capacity Planning & Server Sizing Guide

## Overview

This document provides capacity planning and infrastructure recommendations for hosting the Misfits-Battle platform with **150 concurrent participants**.

---

## Load Analysis

### Expected User Behavior

**Typical Competition Flow:**
1. Login (1 request)
2. View Dashboard (2-3 requests: challenges list, user data)
3. Open Challenge (2 requests: challenge details, boilerplate)
4. Code & Preview (continuous auto-save to localStorage, no server load)
5. Submit Solution (1-2 requests per challenge, max 2 submissions)
6. View Leaderboard (1 request)

**Peak Load Scenario:**
- All 150 users login within 5 minutes: **30 logins/minute**
- All users submit simultaneously: **150 submissions in 1 minute**
- Background processing: **150 rendering tasks queued**

### Request Estimates

| Action | Requests/User | Total (150 users) | Peak Rate |
|--------|---------------|-------------------|-----------|
| Login | 1 | 150 | 30/min |
| Dashboard Load | 3 | 450 | 90/min |
| Challenge Load | 2 | 300 | 60/min |
| Submissions | 2 | 300 | 150/min (worst case) |
| Leaderboard | 5 | 750 | 150/min |
| **Total** | **13** | **1,950** | **480/min (8 req/sec)** |

### Resource-Intensive Operations

1. **Submission Rendering** (CPU-intensive)
   - Playwright browser automation
   - HTML/CSS rendering to PNG
   - ~2-5 seconds per submission
   - 150 submissions = 5-12 minutes total processing time

2. **Database Queries**
   - Leaderboard calculation (aggregation across users)
   - Submission history queries
   - Challenge listings

3. **Static File Serving**
   - Challenge preview images
   - Rendered submission images
   - Frontend assets (handled by Netlify)

---

## Recommended Infrastructure

### Option 1: Single EC2 Instance (Budget-Friendly)

**Instance Type:** `t3.medium` or `t3a.medium`

**Specifications:**
- **vCPUs:** 2
- **RAM:** 4 GB
- **Network:** Up to 5 Gbps
- **Cost:** ~$30-35/month (t3.medium) or ~$27/month (t3a.medium)

**Services on Instance:**
- Django/Gunicorn (Backend API)
- PostgreSQL (Database)
- Redis (Celery broker)
- Celery Worker (Background tasks)
- Nginx (Reverse proxy)

**Capacity:**
- **Concurrent Users:** 150-200
- **Requests/Second:** 10-15
- **Celery Workers:** 2-4 workers
- **Gunicorn Workers:** 4-6 workers

**Pros:**
- Simple setup
- Low cost
- Easy to manage

**Cons:**
- Single point of failure
- Limited scalability
- CPU bottleneck during peak submissions

---

### Option 2: Distributed Setup (Production-Grade)

**Architecture:**

```
┌─────────────────┐
│   Netlify CDN   │  (Frontend - React)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Load Balancer  │  (Application Load Balancer)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│  API   │ │  API   │  (t3.small x2)
│ Server │ │ Server │  Django + Gunicorn
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│   RDS Postgres  │  (db.t3.micro)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  ElastiCache    │  (cache.t3.micro)
│     Redis       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Celery Workers  │  (t3.medium)
│  (Background)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   S3 Bucket     │  (Media storage)
└─────────────────┘
```

**Components:**

1. **API Servers:** 2x `t3.small` (~$15/month each)
   - 2 vCPUs, 2 GB RAM each
   - Auto-scaling group (scale to 3-4 during peak)
   - Handles API requests only

2. **Database:** RDS PostgreSQL `db.t3.micro` (~$15/month)
   - 2 vCPUs, 1 GB RAM
   - Automated backups
   - Multi-AZ for high availability (optional, +$15/month)

3. **Cache:** ElastiCache Redis `cache.t3.micro` (~$12/month)
   - 2 vCPUs, 0.5 GB RAM
   - Celery broker + caching

4. **Background Workers:** 1x `t3.medium` (~$30/month)
   - 2 vCPUs, 4 GB RAM
   - Dedicated Celery workers for rendering
   - 4-6 concurrent workers

5. **Load Balancer:** Application Load Balancer (~$20/month)
   - Distributes traffic across API servers
   - Health checks and auto-scaling

6. **Storage:** S3 (~$5/month)
   - Media files (images)
   - Static files backup

**Total Cost:** ~$112-127/month (without auto-scaling)

**Capacity:**
- **Concurrent Users:** 500+
- **Requests/Second:** 50+
- **High Availability:** Yes
- **Auto-scaling:** Yes

---

## Recommended Configuration for 150 Users

### Best Choice: Option 1 (Single t3.medium)

For 150 concurrent users, a single `t3.medium` instance is sufficient and cost-effective.

**Instance Details:**
- **Type:** t3.medium
- **Region:** Choose closest to your users (e.g., ap-south-1 for India)
- **Storage:** 30 GB GP3 SSD
- **OS:** Ubuntu 22.04 LTS

**Software Stack:**
```
┌─────────────────────────────────┐
│       t3.medium EC2             │
│  ┌───────────────────────────┐  │
│  │  Nginx (Port 80/443)      │  │
│  │  - Reverse Proxy          │  │
│  │  - SSL Termination        │  │
│  └──────────┬────────────────┘  │
│             ▼                    │
│  ┌───────────────────────────┐  │
│  │  Gunicorn (Port 8000)     │  │
│  │  - 4 workers              │  │
│  │  - Django Backend         │  │
│  └──────────┬────────────────┘  │
│             ▼                    │
│  ┌───────────────────────────┐  │
│  │  PostgreSQL (Port 5432)   │  │
│  │  - Local database         │  │
│  └───────────────────────────┘  │
│             ▼                    │
│  ┌───────────────────────────┐  │
│  │  Redis (Port 6379)        │  │
│  │  - Celery broker          │  │
│  └──────────┬────────────────┘  │
│             ▼                    │
│  ┌───────────────────────────┐  │
│  │  Celery Workers (x3)      │  │
│  │  - Background rendering   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Performance Tuning

### 1. Gunicorn Configuration

**File:** `backend/gunicorn.conf.py`

```python
# For t3.medium (2 vCPUs, 4 GB RAM)
workers = 4  # (2 * CPU cores)
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5

# Memory management
max_worker_memory = 512 * 1024 * 1024  # 512 MB per worker
```

### 2. Celery Configuration

**Workers:** 3 concurrent workers

```bash
celery -A backend worker \
  --loglevel=info \
  --concurrency=3 \
  --max-tasks-per-child=100 \
  --time-limit=300
```

**Why 3 workers?**
- 150 submissions / 3 workers = 50 submissions per worker
- ~5 seconds per submission = 250 seconds (~4 minutes) total
- Acceptable processing time for competition

### 3. PostgreSQL Tuning

**File:** `/etc/postgresql/14/main/postgresql.conf`

```conf
# For 4 GB RAM system
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 4. Redis Configuration

**File:** `/etc/redis/redis.conf`

```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save ""  # Disable persistence for speed
```

### 5. Nginx Configuration

```nginx
worker_processes auto;
worker_connections 1024;

http {
    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    upstream backend {
        server 127.0.0.1:8000;
        keepalive 32;
    }
    
    server {
        listen 80;
        
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        location /media/ {
            alias /var/www/misfits-battle/backend/media/;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **CPU Usage**
   - Alert if > 80% for 5 minutes
   - Scale up or optimize code

2. **Memory Usage**
   - Alert if > 85%
   - Check for memory leaks

3. **Disk I/O**
   - Monitor database writes
   - Alert if disk queue > 10

4. **Response Time**
   - API response time < 500ms (p95)
   - Alert if > 1 second

5. **Celery Queue Length**
   - Monitor pending tasks
   - Alert if > 50 tasks queued

### Monitoring Tools

**Free Options:**
- CloudWatch (AWS native)
- Prometheus + Grafana
- Netdata

**Paid Options:**
- Datadog
- New Relic
- Sentry (error tracking)

---

## Load Testing

### Before Competition Day

Run load tests to validate capacity:

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test login endpoint (30 req/sec for 1 minute)
ab -n 1800 -c 30 -p login.json -T application/json \
   https://your-api.com/api/auth/login/

# Test submission endpoint (10 req/sec for 1 minute)
ab -n 600 -c 10 -p submission.json -T application/json \
   -H "Authorization: Token YOUR_TOKEN" \
   https://your-api.com/api/submissions/
```

**Success Criteria:**
- 95% of requests complete in < 1 second
- 0% error rate
- CPU usage < 80%
- Memory usage < 85%

---

## Scaling Strategy

### Vertical Scaling (Upgrade Instance)

If performance issues occur:

1. **t3.medium → t3.large**
   - 2 vCPUs → 4 vCPUs
   - 4 GB RAM → 8 GB RAM
   - Cost: +$30/month

2. **Increase Gunicorn workers:** 4 → 8
3. **Increase Celery workers:** 3 → 6

### Horizontal Scaling (Add Instances)

For 300+ users:

1. Separate database to RDS
2. Add second API server
3. Add load balancer
4. Separate Celery worker instance

---

## Cost Breakdown (150 Users)

### Option 1: Single Instance

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| EC2 Instance | t3.medium | $30 |
| EBS Storage | 30 GB GP3 | $3 |
| Data Transfer | 100 GB/month | $9 |
| Elastic IP | 1 IP | $0 |
| **Total** | | **~$42/month** |

### Option 2: Distributed

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| API Servers | 2x t3.small | $30 |
| RDS Database | db.t3.micro | $15 |
| ElastiCache | cache.t3.micro | $12 |
| Celery Worker | t3.medium | $30 |
| Load Balancer | ALB | $20 |
| S3 Storage | 50 GB | $5 |
| Data Transfer | 200 GB/month | $18 |
| **Total** | | **~$130/month** |

---

## Deployment Checklist

### Pre-Competition (1 Week Before)

- [ ] Provision EC2 instance
- [ ] Install and configure all services
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure firewall (Security Groups)
- [ ] Set up monitoring and alerts
- [ ] Run load tests
- [ ] Create database backup strategy
- [ ] Document rollback procedure

### Competition Day

- [ ] Monitor dashboard open
- [ ] Team on standby
- [ ] Backup instance ready (optional)
- [ ] Database backup taken
- [ ] Rate limiting enabled
- [ ] Celery workers running

### Post-Competition

- [ ] Export all data
- [ ] Generate reports
- [ ] Archive submissions
- [ ] Scale down or terminate resources
- [ ] Review logs for issues

---

## Emergency Procedures

### High CPU Usage

1. Check Celery queue length
2. Temporarily increase Celery workers
3. Restart Gunicorn workers
4. Consider vertical scaling

### Database Slow Queries

1. Check active connections
2. Analyze slow query log
3. Add database indexes if needed
4. Restart PostgreSQL

### Out of Memory

1. Restart services one by one
2. Check for memory leaks
3. Reduce worker count temporarily
4. Upgrade instance size

### Service Crash

1. Check logs: `journalctl -u gunicorn -n 100`
2. Restart service: `sudo systemctl restart gunicorn`
3. Monitor recovery
4. Investigate root cause

---

## Conclusion

For **150 concurrent users**, a single **t3.medium EC2 instance** is recommended:

- **Cost-effective:** ~$42/month
- **Sufficient capacity:** Handles 150-200 users comfortably
- **Simple management:** Single instance to maintain
- **Room for growth:** Can scale to t3.large if needed

For larger competitions (300+ users) or production deployments, consider the distributed architecture for better reliability and scalability.

---

## Additional Resources

- [AWS EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
- [Django Performance Optimization](https://docs.djangoproject.com/en/4.2/topics/performance/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
- [Celery Best Practices](https://docs.celeryproject.org/en/stable/userguide/optimizing.html)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
