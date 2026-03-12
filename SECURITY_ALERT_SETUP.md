# Security Alert System Setup Guide

## Overview

I've implemented a comprehensive security alert system that will:
- **Detect suspicious activities** (SQL injection, path traversal, endpoint enumeration)
- **Send email alerts** to admin when threats are detected
- **Automatically block IPs** after repeated violations
- **Provide admin interface** for managing blocked IPs

## What's Been Implemented

### 🔧 **Backend Components**

1. **Security Models** (`backend/security/models.py`)
   - `SecurityIncident` - Tracks all security events
   - `BlockedIP` - Manages blocked IP addresses
   - `SecurityAlert` - Records sent email notifications

2. **Alert Service** (`backend/security/services.py`)
   - Email notification system
   - Automatic IP blocking logic
   - Threat classification and severity assessment

3. **Enhanced Middleware** (`backend/security/middleware.py`)
   - Real-time threat detection
   - Integration with alert system
   - IP blocking enforcement

4. **Admin Interface** (`backend/security/admin.py`)
   - Django admin for managing security incidents
   - One-click IP blocking/unblocking
   - Security dashboard

## Setup Instructions

### 1. **Configure Email Settings**

Add these to your `backend/.env` file:

```bash
# Security Configuration
SECURITY_ADMIN_EMAIL=your-admin@email.com
SECURITY_FROM_EMAIL=security@binarymisfits.info
SITE_URL=https://api.binarymisfits.info

# Security Thresholds (adjust as needed)
SECURITY_ALERT_THRESHOLD=3          # Send alert after 3 suspicious requests
SECURITY_AUTO_BLOCK_THRESHOLD=5     # Auto-block after 5 suspicious requests  
SECURITY_BLOCK_DURATION_HOURS=24    # Block duration in hours

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=security@binarymisfits.info
```

### 2. **Gmail Setup (Recommended)**

If using Gmail for alerts:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_HOST_PASSWORD`

### 3. **Database Migration**

Run these commands on your EC2 server:

```bash
cd /opt/misfitbattle/backend
source env/bin/activate
python manage.py makemigrations security
python manage.py migrate
```

### 4. **Restart Services**

```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

## How It Works

### 🚨 **Alert Triggers**

**Immediate Alerts** (sent right away):
- SQL injection attempts
- Path traversal attacks
- Critical security violations

**Threshold Alerts** (after multiple incidents):
- 3+ suspicious requests from same IP in 1 hour
- Endpoint enumeration attempts
- Automated tool detection

### 🔒 **Auto-Blocking**

**IPs are automatically blocked when**:
- 5+ suspicious requests in 1 hour
- Critical attacks (SQL injection, etc.)
- Repeated violations after warnings

**Block Duration**:
- Default: 24 hours
- Configurable via settings
- Admin can set permanent blocks

### 📧 **Email Notifications**

**You'll receive emails for**:
- Security incidents with IP details
- Automatic IP blocks
- Attack type and severity
- One-click management links

**Sample Alert Email**:
```
🚨 Security Alert: SQL Injection from 192.168.1.100

IP Address: 192.168.1.100
Type: SQL Injection Attempt
Severity: Critical
Path: /api/auth/signin/
Time: 2024-03-12 15:30:45

Quick Actions:
- Block IP: https://api.binarymisfits.info/admin/security/block-ip/192.168.1.100/
- View Details: https://api.binarymisfits.info/admin/security/incident/123/
```

## Admin Management

### 🎛️ **Django Admin Interface**

Access at: `https://api.binarymisfits.info/admin/security/`

**Security Incidents**:
- View all detected threats
- Filter by type, severity, IP
- One-click IP blocking

**Blocked IPs**:
- Manage blocked addresses
- View block reasons and duration
- Unblock IPs when needed

**Security Alerts**:
- Track sent notifications
- Monitor alert frequency

### 🔧 **Manual IP Management**

**Block an IP manually**:
1. Go to Django Admin → Security → Security Incidents
2. Find incident from target IP
3. Click "Block IP" button

**Unblock an IP**:
1. Go to Django Admin → Security → Blocked IPs
2. Find the blocked IP
3. Click "Unblock" button

## Configuration Options

### ⚙️ **Adjustable Settings**

```python
# In backend/backend/settings.py or .env

SECURITY_ALERT_THRESHOLD = 3        # Incidents before alert
SECURITY_AUTO_BLOCK_THRESHOLD = 5   # Incidents before auto-block
SECURITY_BLOCK_DURATION_HOURS = 24  # Default block duration
```

### 🎯 **Threat Detection**

**Currently detects**:
- SQL injection patterns
- Path traversal attempts
- Script injection
- Endpoint enumeration
- Automated security tools
- Suspicious user agents

**Severity Levels**:
- **Critical**: SQL injection, direct attacks
- **High**: Path traversal, script injection
- **Medium**: Suspicious patterns, enumeration
- **Low**: Minor violations

## Testing the System

### 🧪 **Test Alert System**

```bash
# Test SQL injection detection
curl -X POST "https://api.binarymisfits.info/api/auth/signin/" \
  -d "register_number=' OR '1'='1&password=test"

# Test path traversal detection
curl "https://api.binarymisfits.info/api/../../../etc/passwd"

# Test endpoint enumeration
curl "https://api.binarymisfits.info/api/admin/"
```

**Expected Results**:
- Requests blocked with security error
- Email alert sent to admin
- Incident logged in Django admin
- IP auto-blocked after threshold

### 📊 **Monitor Logs**

```bash
# View security logs
tail -f /var/log/django/security.log

# Check email sending
tail -f /var/log/django/django.log | grep "Security alert"
```

## Troubleshooting

### ❌ **Common Issues**

**Emails not sending**:
- Check Gmail app password
- Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- Check firewall allows SMTP (port 587)

**Alerts not triggering**:
- Verify SECURITY_ADMIN_EMAIL is set
- Check threshold settings
- Review Django logs for errors

**IP blocking not working**:
- Ensure middleware is properly configured
- Check database migrations completed
- Verify cache is working

### 🔍 **Debug Commands**

```bash
# Test email configuration
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test message', 'from@email.com', ['to@email.com'])

# Check security incidents
python manage.py shell
>>> from security.models import SecurityIncident
>>> SecurityIncident.objects.all()

# Test IP blocking
python manage.py shell
>>> from security.services import security_service
>>> security_service.block_ip('192.168.1.100', 'MANUAL', 'Test block')
```

## Security Best Practices

### 🛡️ **Recommendations**

1. **Monitor alerts regularly** - Check email and admin panel daily
2. **Adjust thresholds** - Fine-tune based on your traffic patterns
3. **Whitelist trusted IPs** - Add your office/home IPs to avoid blocking
4. **Regular review** - Weekly review of blocked IPs and incidents
5. **Backup security data** - Include security tables in backups

### 📈 **Scaling Considerations**

- **High traffic sites**: Increase alert thresholds
- **Multiple admins**: Add more email addresses to alerts
- **Geographic blocking**: Consider country-based restrictions
- **Advanced threats**: Integrate with external threat intelligence

## Next Steps

1. **Deploy the updated backend** with security models
2. **Configure email settings** in your .env file
3. **Run database migrations** to create security tables
4. **Test the alert system** with sample attacks
5. **Monitor and adjust** thresholds based on your needs

The system is now ready to protect your API and keep you informed of any security threats!