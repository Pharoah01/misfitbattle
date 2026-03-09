# Quick Start Deployment Guide
# Misfits-Battle: Netlify + AWS EC2

## 🎯 Your Setup (Option A - Root netlify.toml)

```
your-repo/
├── netlify.toml          ✅ Active (deploys frontend)
├── backend/              → Deploy to AWS EC2
└── frontend/             → Deploy to Netlify
```

---

## 🚀 Deployment Steps

### 1️⃣ Deploy Backend to AWS EC2 (Do This First)

```bash
# Follow the comprehensive guide
# See: AWS_EC2_DEPLOYMENT.md

# Quick summary:
1. Launch EC2 instance (Ubuntu 22.04)
2. SSH into instance
3. Install dependencies (Python, PostgreSQL, Redis, Nginx)
4. Clone repository to /var/www/misfits-battle
5. Setup virtual environment
6. Configure .env file
7. Run migrations
8. Setup Gunicorn + Celery services
9. Configure Nginx
10. Setup SSL with Let's Encrypt

# Result: Backend running at http://your-ec2-ip or https://yourdomain.com
```

**Time Required**: 2-3 hours (first time)

---

### 2️⃣ Deploy Frontend to Netlify (Do This Second)

#### Option 1: Via Netlify Dashboard (Recommended)

1. **Go to Netlify**: https://app.netlify.com
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect**: Your GitHub/GitLab repository
4. **Configure Build Settings**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```
5. **Add Environment Variable**:
   ```
   Key: VITE_API_URL
   Value: https://your-backend-domain.com
   ```
6. **Click**: "Deploy site"

#### Option 2: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy from repository root
netlify deploy --prod

# Follow prompts:
# - Build command: npm run build
# - Publish directory: frontend/dist
```

**Time Required**: 10-15 minutes

---

## 🔗 Connect Frontend to Backend

### Step 1: Update Backend CORS

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Edit .env file
nano /var/www/misfits-battle/backend/.env
```

Add your Netlify domain:
```bash
CORS_ALLOWED_ORIGINS=https://your-site.netlify.app,https://yourdomain.com
```

Restart Gunicorn:
```bash
sudo systemctl restart gunicorn
```

### Step 2: Update Frontend API URL

In Netlify Dashboard:
1. Go to: Site settings → Environment variables
2. Update: `VITE_API_URL` = `https://your-backend-domain.com`
3. Trigger redeploy

---

## ✅ Verification Checklist

### Backend (EC2)
- [ ] API accessible: `https://your-domain.com/api/`
- [ ] Admin panel accessible: `https://your-domain.com/admin/`
- [ ] Can login to admin
- [ ] Gunicorn service running: `sudo systemctl status gunicorn`
- [ ] Celery service running: `sudo systemctl status celery`
- [ ] Redis running: `redis-cli ping`
- [ ] Nginx running: `sudo systemctl status nginx`

### Frontend (Netlify)
- [ ] Site accessible: `https://your-site.netlify.app`
- [ ] Purple theme displays correctly
- [ ] No console errors (F12 → Console)
- [ ] Fonts loading (Orbitron, Rajdhani)

### Integration
- [ ] User registration works
- [ ] User login works
- [ ] Profile completion works
- [ ] Challenges load
- [ ] Code editor works
- [ ] Live preview updates
- [ ] Code submission works
- [ ] No CORS errors in console

---

## 🔧 Configuration Files

### Root `netlify.toml` (Active)
```toml
[build]
  command = "npm run build"
  publish = "frontend/dist"
  base = "frontend"
```

### Backend `.env` (EC2)
```bash
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-ec2-ip,yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-site.netlify.app
DB_ENGINE=django.db.backends.postgresql
# ... other settings
```

### Frontend `.env.production`
```bash
VITE_API_URL=https://your-backend-domain.com
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────┐
│         User's Browser              │
└────────────┬────────────────────────┘
             │
             ├─────────────────────────┐
             │                         │
             ▼                         ▼
┌────────────────────┐    ┌───────────────────────┐
│   Netlify (CDN)    │    │   AWS EC2             │
│   ─────────────    │    │   ─────────────       │
│   • React App      │───▶│   • Django API        │
│   • Static Files   │    │   • Gunicorn          │
│   • HTTPS (Free)   │    │   • Celery Worker     │
│   • Purple Theme   │    │   • Redis             │
│                    │    │   • PostgreSQL        │
│   $0/month         │    │   • Nginx             │
└────────────────────┘    │                       │
                          │   $0-17/month         │
                          └───────────────────────┘
```

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" or CORS errors
**Solution**: 
1. Check backend CORS settings include Netlify domain
2. Restart Gunicorn: `sudo systemctl restart gunicorn`
3. Check browser console for exact error

### Issue: Netlify build fails
**Solution**:
1. Check build logs in Netlify dashboard
2. Verify `VITE_API_URL` is set in environment variables
3. Test build locally: `cd frontend && npm run build`

### Issue: Backend not accessible
**Solution**:
1. Check EC2 security group allows ports 80, 443
2. Check Nginx status: `sudo systemctl status nginx`
3. Check Gunicorn status: `sudo systemctl status gunicorn`
4. View logs: `sudo journalctl -u gunicorn -f`

### Issue: Submissions not processing
**Solution**:
1. Check Celery status: `sudo systemctl status celery`
2. Check Redis: `redis-cli ping`
3. View Celery logs: `sudo tail -f /var/log/celery/worker.log`

---

## 📚 Full Documentation

- **Backend Deployment**: `AWS_EC2_DEPLOYMENT.md`
- **Frontend Deployment**: `frontend/NETLIFY_DEPLOYMENT.md`
- **Complete Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🎉 Success!

Once everything is deployed:

1. **Frontend URL**: `https://your-site.netlify.app`
2. **Backend API**: `https://your-domain.com/api/`
3. **Admin Panel**: `https://your-domain.com/admin/`

Share the frontend URL with your users and start the competition! 🚀

---

## 💡 Pro Tips

1. **Use Custom Domain**: Point your domain to both Netlify and EC2 for professional URLs
2. **Monitor Logs**: Check logs regularly during first 24 hours
3. **Backup Database**: Setup automated backups on EC2
4. **Test Thoroughly**: Test all user flows before announcing
5. **Have Rollback Plan**: Keep previous working deployment accessible

---

## 📞 Need Help?

- Check troubleshooting section above
- Review full deployment guides
- Check service logs on EC2
- Review Netlify build logs
- Test locally first: `npm run dev` (frontend) and `python manage.py runserver` (backend)
