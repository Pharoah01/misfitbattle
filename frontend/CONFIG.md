# Frontend Configuration Guide

## Environment Variables

The frontend application uses environment variables to configure the API connection and other settings.

### Files

- **`.env.development`** - Used during local development (`npm run dev`)
- **`.env.production`** - Used for production builds (`npm run build`)
- **`.env.example`** - Template file for reference (committed to git)

### Variables

#### VITE_API_URL

The base URL for the backend API.

- **Development**: `http://localhost:8000`
- **Production**: Update to your production API URL

**Note**: Vite only exposes environment variables prefixed with `VITE_` to the client-side code.

## Application Constants

The `src/config/constants.ts` file contains application-wide constants:

### API Configuration
- `API_BASE_URL` - Backend API URL (from VITE_API_URL env variable)

### Authentication
- `TOKEN_STORAGE_KEY` - localStorage key for access token
- `REFRESH_TOKEN_STORAGE_KEY` - localStorage key for refresh token

### Code Editor
- `MAX_CODE_LENGTH` - Maximum allowed code length (10,000 characters)
- `CODE_LENGTH_WARNING_THRESHOLD` - Show warning at this length (9,000 characters)

### Performance
- `LIVE_PREVIEW_DEBOUNCE_DELAY` - Debounce delay for live preview updates (300ms)
- `SEARCH_INPUT_DEBOUNCE_DELAY` - Debounce delay for search input (500ms)
- `AUTO_SAVE_DEBOUNCE_DELAY` - Debounce delay for auto-save (1000ms)

### Caching
- `CACHE_TIME.CHALLENGES` - Cache time for challenges list (5 minutes)
- `CACHE_TIME.CHALLENGE_DETAIL` - Cache time for challenge details (10 minutes)
- `CACHE_TIME.SUBMISSIONS` - Cache time for submissions (2 minutes)
- `CACHE_TIME.LEADERBOARD` - Cache time for leaderboard (30 seconds)

### Validation
- `VALIDATION_PATTERNS.REGISTER_NUMBER` - Regex for register number validation
- `VALIDATION_PATTERNS.EMAIL` - Regex for email validation
- `VALIDATION_PATTERNS.PASSWORD` - Regex for password validation

### Messages
- `ERROR_MESSAGES` - Standard error messages for different scenarios
- `SUCCESS_MESSAGES` - Standard success messages for different actions

## Usage

### In Components

```typescript
import { API_BASE_URL, MAX_CODE_LENGTH } from '@/config/constants';

// Use the constants
console.log('API URL:', API_BASE_URL);
console.log('Max code length:', MAX_CODE_LENGTH);
```

### Environment-Specific Configuration

The application automatically uses the correct `.env` file based on the command:

- `npm run dev` → Uses `.env.development`
- `npm run build` → Uses `.env.production`

## Setup for New Developers

1. Copy `.env.example` to `.env.development`:
   ```bash
   cp .env.example .env.development
   ```

2. Update `VITE_API_URL` if your backend runs on a different port

3. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

1. Update `.env.production` with your production API URL:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. The built files in `dist/` will use the production configuration

## Security Notes

- Environment files (`.env.development`, `.env.production`) are in `.gitignore`
- Only `.env.example` is committed to version control
- Never commit sensitive credentials to environment files
- The `VITE_` prefix means these variables are exposed to the client-side code
- Do not store secrets in environment variables that start with `VITE_`
