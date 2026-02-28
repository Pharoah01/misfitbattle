# URGENT FIXES NEEDED

## ✅ COMPLETED
1. Fixed session logout on refresh - Added refresh token call before getCurrentUser
2. Updated color system to use #C00000 (red) instead of blue/purple
3. Updated Tailwind config with correct colors

## 🚨 REMAINING CRITICAL FIXES

### 1. Redesign All Pages with Correct Colors
Need to update:
- Home.tsx - Remove blue/purple gradients, use #C00000
- Login.tsx - Change blue buttons to red
- Register.tsx - Change purple buttons to red
- Dashboard.tsx - Use dark theme (#0B0B0B background)
- ChallengePage.tsx - Update color scheme
- Profile.tsx - Update color scheme

### 2. Add Loading Skeletons
Create skeleton components for:
- Challenge cards
- Dashboard loading state
- Profile loading state

### 3. Add Error States with Retry Buttons
Update:
- Dashboard - Add retry button when API fails
- ChallengePage - Add retry button
- Profile - Add retry button

### 4. Public Landing Page
Update Home.tsx to:
- Show preview of challenges (read-only)
- Explain platform
- Allow navigation without login
- Show "Sign in to play" CTA

### 5. Dashboard Must Never Be Empty
Add:
- Loading skeletons while fetching
- Friendly error UI if API fails
- Retry button + explanation
- Fallback content

## Color System (STRICT)
```
Primary Red: #C00000
Dark Background: #0B0B0B
Surface: #111111
Border Gray: #2A2A2A
Text Primary: #FFFFFF
Text Secondary: #B0B0B0
```

## Next Steps
1. Redesign all pages with correct colors
2. Add skeleton loaders
3. Add error states with retry buttons
4. Test session persistence
5. Make dashboard functional and informative
