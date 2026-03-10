# CSSBattle Frontend Specification

## Overview

React-based frontend for the CSSBattle coding competition platform. Connects to Django REST API backend.

## Technology Stack

- **Framework**: React 18+
- **Routing**: React Router v6
- **State Management**: Context API + React Query
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code editor)
- **UI Components**: Headless UI / Radix UI
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axios.js              # Axios instance with interceptors
│   │   ├── auth.js               # Auth API calls
│   │   ├── challenges.js         # Challenge API calls
│   │   ├── submissions.js        # Submission API calls
│   │   └── leaderboard.js        # Leaderboard API calls
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   ├── auth/
│   │   │   ├── SignUpForm.jsx
│   │   │   ├── SignInForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── challenges/
│   │   │   ├── ChallengeCard.jsx
│   │   │   ├── ChallengeList.jsx
│   │   │   ├── ChallengeDetail.jsx
│   │   │   └── ChallengeForm.jsx (admin)
│   │   ├── editor/
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── HTMLEditor.jsx
│   │   │   ├── CSSEditor.jsx
│   │   │   └── LivePreview.jsx
│   │   ├── submissions/
│   │   │   ├── SubmissionList.jsx
│   │   │   └── SubmissionCard.jsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.jsx
│   │   │   └── LeaderboardRow.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       ├── Modal.jsx
│   │       ├── Loading.jsx
│   │       └── Toast.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useChallenges.js
│   │   ├── useSubmissions.js
│   │   └── useLeaderboard.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SignUp.jsx
│   │   ├── SignIn.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ChallengePage.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Profile.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       └── ManageChallenges.jsx
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Pages & Features

### 1. Home Page (`/`)
- Welcome message
- Platform overview
- Call-to-action buttons (Sign Up / Sign In)
- Featured challenges preview
- Leaderboard preview (top 5)

### 2. Sign Up Page (`/signup`)
- Registration form:
  - Register Number
  - Name
  - Email
  - Password
  - Confirm Password
- Form validation
- Redirect to dashboard on success
- Link to sign in page

### 3. Sign In Page (`/signin`)
- Login form:
  - Register Number
  - Password
- Remember me checkbox
- Redirect to dashboard on success
- Link to sign up page

### 4. Dashboard (`/dashboard`)
**Protected Route - Requires Authentication**

- User stats card:
  - Total submissions
  - Challenges solved
  - Total points
  - Current rank
- Challenge list with filters:
  - Search by title
  - Filter by points
  - Sort by date/points
- Quick actions:
  - Start new challenge
  - View leaderboard
  - View submissions

### 5. Challenge Page (`/challenge/:id`)
**Protected Route - Requires Authentication**

**Layout**: Split view (3 panels)

**Left Panel - Challenge Details:**
- Challenge title
- Description
- Points
- Boilerplate code display

**Middle Panel - Code Editor:**
- HTML editor (top)
- CSS editor (bottom)
- Syntax highlighting
- Line numbers
- Auto-completion
- Code length counter
- Submit button

**Right Panel - Live Preview:**
- Real-time rendering
- Iframe sandbox
- Refresh button
- Fullscreen toggle

**Features:**
- Auto-save to localStorage
- Code length validation
- Submit solution
- View previous submissions

### 6. Leaderboard Page (`/leaderboard`)
**Protected Route - Requires Authentication**

- Ranked table:
  - Rank
  - Register Number
  - Name
  - Total Points
  - Challenges Solved
- Current user highlight
- Real-time updates
- Pagination
- Search/filter users

### 7. Profile Page (`/profile`)
**Protected Route - Requires Authentication**

- User information
- Submission history:
  - Challenge name
  - Code length
  - Submission date
  - View code button
- Statistics:
  - Total submissions
  - Challenges solved
  - Average code length
  - Best rank achieved

### 8. Admin Dashboard (`/admin`)
**Protected Route - Requires Admin Privileges**

- Statistics overview:
  - Total users
  - Total challenges
  - Total submissions
  - Active users
- Quick actions:
  - Create challenge
  - View all submissions
  - Manage users

### 9. Manage Challenges (`/admin/challenges`)
**Protected Route - Requires Admin Privileges**

- Challenge list with actions:
  - Edit
  - Delete
  - View submissions
- Create new challenge form:
  - Title
  - Description
  - HTML boilerplate
  - CSS boilerplate
  - Points
- Edit challenge form
- Delete confirmation modal

## Key Components

### Navbar
- Logo
- Navigation links:
  - Dashboard
  - Leaderboard
  - Profile
- User menu dropdown:
  - Profile
  - Sign Out
- Admin link (if admin)

### Code Editor
- Monaco Editor integration
- Language: HTML/CSS
- Theme: VS Code Dark
- Features:
  - Syntax highlighting
  - Auto-completion
  - Error detection
  - Line numbers
  - Minimap

### Live Preview
- Iframe rendering
- Sandboxed execution
- Real-time updates (debounced)
- Responsive preview
- Error handling

### Toast Notifications
- Success messages
- Error messages
- Info messages
- Auto-dismiss
- Position: top-right

## API Integration

### Authentication
```javascript
// Sign Up
POST /api/auth/signup/
Body: { register_number, name, email, password }
Response: { token, user }

// Sign In
POST /api/auth/signin/
Body: { register_number, password }
Response: { token, user }

// Sign Out
POST /api/auth/signout/
Headers: { Authorization: Token <token> }

// Get Current User
GET /api/auth/me/
Headers: { Authorization: Token <token> }
Response: { id, register_number, name, email, is_admin }
```

### Challenges
```javascript
// List Challenges
GET /api/challenges/
Headers: { Authorization: Token <token> }
Query: ?search=&points__gte=&ordering=

// Get Challenge
GET /api/challenges/:id/
Headers: { Authorization: Token <token> }

// Create Challenge (Admin)
POST /api/challenges/
Headers: { Authorization: Token <token> }
Body: { title, description, html_boilerplate, css_boilerplate, points }

// Update Challenge (Admin)
PUT /api/challenges/:id/
Headers: { Authorization: Token <token> }

// Delete Challenge (Admin)
DELETE /api/challenges/:id/
Headers: { Authorization: Token <token> }
```

### Submissions
```javascript
// Submit Solution
POST /api/submissions/
Headers: { Authorization: Token <token> }
Body: { challenge, html_code, css_code }

// Get User Submissions
GET /api/submissions/
Headers: { Authorization: Token <token> }
Query: ?challenge=&ordering=

// Delete Submission
DELETE /api/submissions/:id/
Headers: { Authorization: Token <token> }
```

### Leaderboard
```javascript
// Get Leaderboard
GET /api/leaderboard/
Headers: { Authorization: Token <token> }
Response: [{ rank, register_number, name, total_points, solved_count }]
```

## State Management

### Auth Context
```javascript
{
  user: { id, register_number, name, email, is_admin },
  token: string,
  isAuthenticated: boolean,
  isAdmin: boolean,
  signUp: (data) => Promise,
  signIn: (data) => Promise,
  signOut: () => void,
  loading: boolean
}
```

### React Query Keys
```javascript
['challenges']
['challenges', id]
['submissions']
['submissions', challengeId]
['leaderboard']
['user']
```

## Styling Guidelines

### Color Palette
```css
Primary: #3B82F6 (blue-500)
Secondary: #8B5CF6 (purple-500)
Success: #10B981 (green-500)
Error: #EF4444 (red-500)
Warning: #F59E0B (amber-500)
Background: #0F172A (slate-900)
Surface: #1E293B (slate-800)
Text: #F1F5F9 (slate-100)
```

### Typography
- Font Family: Inter, system-ui
- Headings: font-bold
- Body: font-normal
- Code: font-mono

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Security

### Token Management
- Store token in localStorage
- Include in Authorization header
- Auto-refresh on 401 errors
- Clear on sign out

### Protected Routes
- Check authentication before rendering
- Redirect to sign in if not authenticated
- Check admin flag for admin routes

### Input Validation
- Client-side validation
- Sanitize user input
- Validate before API calls

## Performance Optimization

### Code Splitting
- Lazy load pages
- Lazy load Monaco Editor
- Dynamic imports for heavy components

### Caching
- React Query caching
- Cache challenges list
- Cache leaderboard (5 min)
- Invalidate on mutations

### Debouncing
- Live preview updates (300ms)
- Search input (500ms)
- Auto-save (1000ms)

## Error Handling

### API Errors
- Network errors
- 401 Unauthorized → redirect to sign in
- 403 Forbidden → show error message
- 404 Not Found → show not found page
- 500 Server Error → show error message

### User Feedback
- Loading states
- Success toasts
- Error toasts
- Form validation errors

## Testing Strategy

### Unit Tests
- Component rendering
- Hook logic
- Utility functions

### Integration Tests
- API integration
- Form submissions
- Navigation flows

### E2E Tests
- Complete user flows
- Sign up → challenge → submit → leaderboard

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=CSSBattle
```

### Hosting Options
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Next Steps

1. Initialize React project with Vite
2. Install dependencies
3. Set up Tailwind CSS
4. Create folder structure
5. Implement authentication
6. Build core components
7. Integrate API
8. Add Monaco Editor
9. Implement live preview
10. Test and deploy

---

**Ready to start building!** 🚀
