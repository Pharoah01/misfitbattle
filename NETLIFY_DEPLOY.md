# Netlify Deployment Instructions

## Environment Variable Required

The frontend needs the following environment variable set in Netlify:

```
VITE_API_URL=https://api.binarymisfits.info
```

## How to Set Environment Variable in Netlify

1. Go to https://app.netlify.com
2. Select your site (binarymisfits.info)
3. Go to Site configuration → Environment variables
4. Add variable:
   - Key: `VITE_API_URL`
   - Value: `https://api.binarymisfits.info`
5. Save and redeploy

## Alternative: Deploy via Git Push

If you have Git connected to Netlify, you can trigger a deploy by pushing any change:

```bash
git add .
git commit -m "Trigger redeploy with API URL update"
git push origin main
```

Netlify will automatically rebuild and deploy.

## Verify Deployment

After deployment, check:
- Frontend should connect to https://api.binarymisfits.info
- Challenge pages should load correctly
- Login and authentication should work

---

**Current Status**: Backend is live at https://api.binarymisfits.info
**Frontend**: Needs redeploy with correct VITE_API_URL
