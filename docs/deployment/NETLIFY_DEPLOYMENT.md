# Netlify Deployment Guide - Misfits-Battle Frontend

## Prerequisites
- Netlify account
- GitHub/GitLab repository (or manual deployment)
- Backend API deployed and accessible

## Quick Start

### Option 1: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd frontend
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click "Deploy site"

### Option 3: Manual Drag & Drop
```bash
# Build the project locally
cd frontend
npm install
npm run build

# Drag the 'dist' folder to Netlify dashboard
```

## Environment Variables

### Required Environment Variables in Netlify
Go to Site settings → Environment variables and add:

```
VITE_API_URL=https://your-backend-api.com
```

**Important**: Replace with your actual backend API URL

### Local vs Production URLs
- **Local Development**: `http://localhost:8000`
- **Production**: Update `.env.production` with your backend URL

## Build Configuration

The `netlify.toml` file is already configured with:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ SPA routing (all routes → index.html)
- ✅ Security headers
- ✅ Asset caching
- ✅ HTTPS redirect

## Post-Deployment Checklist

### 1. Update Backend CORS Settings
Add your Netlify domain to Django CORS settings:

```python
# backend/backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://your-netlify-site.netlify.app",  # Add this
    "https://yourdomain.com",  # If using custom domain
]
```

### 2. Update Environment Variables
```bash
# In Netlify dashboard, set:
VITE_API_URL=https://your-backend-domain.com
```

### 3. Test Critical Flows
- [ ] User registration
- [ ] User login
- [ ] Profile completion
- [ ] Challenge loading
- [ ] Code submission
- [ ] Preview rendering

### 4. Configure Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   ```

### 5. Enable HTTPS
- Netlify provides free SSL certificates
- Auto-enabled for *.netlify.app domains
- For custom domains: Site settings → Domain management → HTTPS

## Continuous Deployment

### Auto-deploy on Git Push
Netlify automatically deploys when you push to your main branch.

### Deploy Previews
- Every pull request gets a preview URL
- Test changes before merging

### Branch Deploys
Configure specific branches for staging:
```
main → Production
staging → Staging environment
```

## Performance Optimization

### Already Configured
- ✅ Asset caching (1 year for static files)
- ✅ Gzip compression (automatic)
- ✅ CDN distribution (automatic)
- ✅ HTTP/2 support (automatic)

### Additional Optimizations
1. **Enable Netlify Analytics** (optional, paid)
2. **Add Lighthouse CI** for performance monitoring
3. **Configure build plugins** in netlify.toml

## Troubleshooting

### Build Fails
```bash
# Check build logs in Netlify dashboard
# Common issues:
# 1. Missing dependencies → Check package.json
# 2. TypeScript errors → Run `npm run build` locally first
# 3. Environment variables → Verify VITE_API_URL is set
```

### 404 on Routes
- Ensure `netlify.toml` has SPA redirect rule (already configured)
- Check publish directory is set to `dist`

### API Connection Issues
```bash
# Check CORS settings in backend
# Verify VITE_API_URL in Netlify environment variables
# Check browser console for errors
```

### Fonts Not Loading
- Google Fonts are configured in index.html
- Check CSP headers in netlify.toml (already configured)

## Monitoring

### Netlify Analytics
- View in Netlify dashboard
- Track page views, unique visitors, bandwidth

### Error Tracking (Recommended)
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user analytics

## Rollback

### Revert to Previous Deploy
1. Go to Deploys tab in Netlify dashboard
2. Find the working deployment
3. Click "Publish deploy"

### Lock Deploys
Temporarily stop auto-deploys:
```bash
netlify deploy --prod --lock
```

## Security

### Already Configured in netlify.toml
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Content Security Policy
- ✅ HTTPS redirect

### Additional Security
1. Enable Netlify Identity (if needed)
2. Configure rate limiting
3. Add DDoS protection (Enterprise)

## Cost Estimation

### Free Tier Includes
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- HTTPS
- CDN

### Paid Features
- Netlify Analytics: $9/month
- Background Functions: Usage-based
- High-Performance Edge: $19/month

## Support

### Netlify Resources
- Docs: https://docs.netlify.com
- Community: https://answers.netlify.com
- Status: https://www.netlifystatus.com

### Project-Specific Issues
- Check GitHub issues
- Review build logs
- Test locally first: `npm run build && npm run preview`

## Quick Commands

```bash
# Install dependencies
npm install

# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Netlify
netlify deploy --prod

# View deploy logs
netlify logs

# Open Netlify dashboard
netlify open
```

## Next Steps After Deployment

1. ✅ Verify site is accessible
2. ✅ Test all user flows
3. ✅ Update backend CORS
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring
6. ✅ Share with team/users

---

**Deployment Date**: _Add date here_  
**Deployed URL**: _Add Netlify URL here_  
**Backend API**: _Add backend URL here_
