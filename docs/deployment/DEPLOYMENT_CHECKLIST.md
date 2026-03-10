# Deployment Checklist - Misfits-Battle
# Netlify (Frontend) + AWS EC2 (Backend)

## Pre-Deployment Preparation

### 1. Code Preparation
- [ ] All code committed to Git repository
- [ ] `.env` files configured (but not committed)
- [ ] `requirements.txt` up to date
- [ ] `package.json` dependencies up to date
- [ ] All tests passing locally

### 2. Environment Variables Prepared
- [ ] Django `SECRET_KEY` generated
- [ ] Database credentials ready
- [ ] CORS origins list prepared
- [ ] API URL for frontend configured

### 3. Domain/DNS (Optional)
- [ ] Domain purchased (if using custom domain)
- [ ] DNS provider access ready
- [ ] SSL certificate plan (Let's Encrypt recommended)

---

## Backend Deployment (AWS EC2)

### Phase 1: AWS Setup
- [ ] AWS account created
- [ ] EC2 instance launched (Ubuntu 22.04)
- [ ] Security group configured (ports 22, 80, 443)
- [ ] SSH key pair downloaded (.pem file)
- [ ] Elastic IP allocated (optional but recommended)
- [ ] Connected to instance via SSH

### Phase 2: Server Configuration
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Python 3.11 installed
- [ ] PostgreSQL installed and configured (or using SQLite)
- [ ] Redis installed and running
- [ ] Nginx installed
- [ ] System dependencies installed (Playwright, etc.)

### Phase 3: Application Setup
- [ ] Code uploaded/cloned to `/var/www/misfits-battle`
- [ ] Virtual environment created
- [ ] Python dependencies installed
- [ ] Playwright browsers installed
- [ ] `.env` file configured with production values
- [ ] Database migrations run
- [ ] Superuser created
- [ ] Static files collected
- [ ] Challenge slugs generated

### Phase 4: Services Configuration
- [ ] Gunicorn service created and started
- [ ] Celery service created and started
- [ ] Nginx configured and restarted
- [ ] All services enabled for auto-start
- [ ] Services tested and running

### Phase 5: SSL/HTTPS (Production)
- [ ] Domain pointed to EC2 IP
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS redirect configured
- [ ] Certificate auto-renewal tested

### Phase 6: Backend Testing
- [ ] API accessible at `http://your-ip/api/`
- [ ] Admin panel accessible at `http://your-ip/admin/`
- [ ] Can login to admin panel
- [ ] Can create challenges via admin
- [ ] Media files upload working
- [ ] Celery processing tasks
- [ ] Redis connection working

---

## Frontend Deployment (Netlify)

### Phase 1: Netlify Setup
- [ ] Netlify account created
- [ ] Repository connected (or manual upload ready)
- [ ] Build settings configured:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/dist`

### Phase 2: Environment Configuration
- [ ] `VITE_API_URL` set in Netlify environment variables
- [ ] `.env.production` updated with backend URL
- [ ] Build triggered

### Phase 3: Frontend Testing
- [ ] Site accessible at Netlify URL
- [ ] All pages load correctly
- [ ] Fonts loading (Google Fonts)
- [ ] Purple theme displaying correctly
- [ ] No console errors

---

## Integration Testing

### Phase 1: CORS Configuration
- [ ] Backend CORS settings include Netlify domain
- [ ] Gunicorn restarted after CORS update
- [ ] Browser console shows no CORS errors

### Phase 2: Authentication Flow
- [ ] User registration works
- [ ] Email validation works
- [ ] User login works
- [ ] Token stored in localStorage
- [ ] Protected routes work
- [ ] Logout works

### Phase 3: Profile System
- [ ] Profile completion flow works
- [ ] College dropdown displays correctly
- [ ] Profile data saves
- [ ] Profile page displays data
- [ ] Edit profile works

### Phase 4: Challenge System
- [ ] Challenges load on dashboard
- [ ] Challenge page loads
- [ ] Code editor works
- [ ] Live preview updates
- [ ] Target image displays correctly
- [ ] Color palette displays
- [ ] Scale to Fit toggle works

### Phase 5: Submission System
- [ ] Code submission works
- [ ] Celery processes submission
- [ ] HTML/CSS rendering works
- [ ] Heatmap comparison works (if API available)
- [ ] Submission status updates
- [ ] Error handling works

---

## Post-Deployment

### Monitoring Setup
- [ ] Server monitoring configured
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Error tracking setup (optional: Sentry)
- [ ] Uptime monitoring (optional: UptimeRobot)

### Documentation
- [ ] Deployment documentation updated
- [ ] API endpoints documented
- [ ] Admin credentials stored securely
- [ ] Team members have access
- [ ] Troubleshooting guide reviewed

### Performance
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Image optimization verified
- [ ] CDN working (Netlify automatic)
- [ ] Database queries optimized

### Security
- [ ] HTTPS enabled and working
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Admin panel secured
- [ ] SSH key-only access
- [ ] Firewall rules verified
- [ ] Sensitive data not exposed

---

## Launch Preparation

### Final Checks
- [ ] All features tested end-to-end
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done
- [ ] Load testing performed (optional)
- [ ] Backup created
- [ ] Rollback plan prepared

### Communication
- [ ] Team notified of deployment
- [ ] Users notified (if applicable)
- [ ] Support channels ready
- [ ] Announcement prepared

### Monitoring First 24 Hours
- [ ] Monitor error logs
- [ ] Monitor server resources
- [ ] Monitor user feedback
- [ ] Check submission processing
- [ ] Verify Celery queue not backing up

---

## Rollback Plan

### If Issues Occur
1. **Frontend Issues**:
   - Revert to previous Netlify deploy
   - Check environment variables
   - Review build logs

2. **Backend Issues**:
   - Restart services: `sudo systemctl restart gunicorn celery`
   - Check logs: `sudo journalctl -u gunicorn -f`
   - Restore database backup if needed
   - Revert code: `git checkout previous-commit`

3. **Database Issues**:
   - Restore from backup
   - Check migration status
   - Verify database credentials

---

## Quick Reference

### Important URLs
- **Frontend**: https://your-site.netlify.app
- **Backend API**: https://your-domain.com/api/
- **Admin Panel**: https://your-domain.com/admin/
- **AWS Console**: https://console.aws.amazon.com

### Important Commands
```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Restart services
sudo systemctl restart gunicorn celery nginx

# View logs
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/celery/worker.log

# Update code
cd /var/www/misfits-battle && git pull
sudo systemctl restart gunicorn celery
```

### Important Files
- Backend env: `/var/www/misfits-battle/backend/.env`
- Gunicorn service: `/etc/systemd/system/gunicorn.service`
- Celery service: `/etc/systemd/system/celery.service`
- Nginx config: `/etc/nginx/sites-available/misfits-battle`

---

## Success Criteria

### Deployment is successful when:
- ✅ Frontend loads on Netlify with purple theme
- ✅ Backend API responds on EC2
- ✅ Users can register and login
- ✅ Users can complete profile
- ✅ Challenges load and display correctly
- ✅ Code editor and preview work
- ✅ Submissions process successfully
- ✅ HTTPS enabled (production)
- ✅ No console errors
- ✅ All services running and stable

---

**Estimated Deployment Time**: 2-4 hours (first time)

**Recommended Team**: 2 people (one for frontend, one for backend)

**Best Practice**: Deploy to staging environment first, then production
