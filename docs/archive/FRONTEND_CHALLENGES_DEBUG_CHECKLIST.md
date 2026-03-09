# Frontend Challenges GET Method - Debug Checklist

## 1. Backend Server Status
- [ ] Django server is running on http://localhost:8000
- [ ] No errors in Django console
- [ ] Can access http://localhost:8000/admin/

## 2. Backend API Endpoint Test
- [ ] Visit http://localhost:8000/api/challenges/ in browser
- [ ] Should see JSON response with challenge data
- [ ] Response should be an array: `[{...}]` not paginated object

## 3. Backend CORS Configuration
- [ ] `CORS_ALLOW_ALL_ORIGINS = True` in settings.py (for development)
- [ ] `CORS_ALLOW_CREDENTIALS = False` in settings.py
- [ ] `corsheaders` in INSTALLED_APPS
- [ ] `corsheaders.middleware.CorsMiddleware` in MIDDLEWARE (before CommonMiddleware)

## 4. Backend Permissions
- [ ] ChallengeViewSet uses `[IsAdminOrReadOnly]` only (no IsAuthenticated)
- [ ] IsAdminOrReadOnly allows public read: `return True` for SAFE_METHODS

## 5. Frontend Server Status
- [ ] Frontend running on http://localhost:5173
- [ ] No build errors in terminal
- [ ] Can access http://localhost:5173

## 6. Frontend API Configuration
- [ ] VITE_API_URL=http://localhost:8000 in .env.development
- [ ] API_BASE_URL correctly set in constants.ts
- [ ] API endpoints use /api/challenges/ (with /api/ prefix)

## 7. Frontend Network Request
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Refresh page
- [ ] Look for request to http://localhost:8000/api/challenges/
- [ ] Check request status: should be 200 OK (not 401, 404, or 500)
- [ ] Check response: should contain challenge array

## 8. Frontend Console Errors
- [ ] Open browser DevTools (F12) → Console tab
- [ ] No CORS errors
- [ ] No "Failed to fetch" errors
- [ ] No authentication errors

## 9. Data Format
- [ ] Backend returns array of challenges (not paginated object)
- [ ] Each challenge has: id, title, description, points, palette (array), preview_image
- [ ] Palette is array of strings: ["#FF0000", "#00FF00"]

## 10. React Query Cache
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Clear localStorage (F12 → Application → Local Storage → Clear)
- [ ] Hard refresh (Ctrl+Shift+R)

---

## Quick Test Commands

### Test Backend API Directly:
```bash
# In browser or curl:
http://localhost:8000/api/challenges/
```

### Expected Response:
```json
[
  {
    "id": 1,
    "title": "THE CENTER SQUARE",
    "description": "...",
    "html_boilerplate": "...",
    "css_boilerplate": "...",
    "palette": ["#D0FF00", "#FF2222"],
    "preview_image": "http://localhost:8000/media/...",
    "points": 100,
    "created_at": "2026-02-26T..."
  }
]
```

### Check Frontend Request:
1. Open http://localhost:5173
2. F12 → Network tab
3. Filter: XHR
4. Look for: `challenges?search=&ordering=points`
5. Status should be: 200 OK
6. Response should match above format

---

## Common Issues & Fixes

### Issue: 401 Unauthorized
**Fix:** Remove `IsAuthenticated` from ChallengeViewSet permissions

### Issue: 404 Not Found
**Fix:** Ensure endpoint is `/api/challenges/` not `/challenges/`

### Issue: CORS Error
**Fix:** Set `CORS_ALLOW_ALL_ORIGINS = True` and restart Django

### Issue: Empty Array []
**Fix:** Check if challenge exists in Django admin

### Issue: Paginated Response
**Fix:** Backend returns `{"results": [...]}` but frontend expects `[...]`
**Solution:** Update frontend to handle pagination OR disable pagination for challenges

---

## Next Steps

1. **Check each item** in the checklist above
2. **Share the results** of:
   - What you see at http://localhost:8000/api/challenges/
   - What you see in browser Network tab (F12)
   - What errors appear in Console tab (F12)
3. **I'll provide the exact fix** based on what's failing
