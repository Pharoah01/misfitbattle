# Backend Palette Feature Migration

## Changes Made

### 1. Removed Leaderboard Module
- Removed `leaderboard` from `INSTALLED_APPS` in settings.py
- Removed `/api/leaderboard/` route from urls.py
- Leaderboard app directory still exists but is no longer active

### 2. Added Palette Field to Challenge Model
- **Field**: `palette` (CharField, max_length=500)
- **Validation**: Comma-separated hex colors (e.g., `#FF5733,#33FF57,#3357FF`)
- **Format**: Each color must match pattern `#RRGGBB` (6 hex digits)
- **API Behavior**: Read-only in API (cannot be set via API, only through admin)

### 3. Added Preview Image Field
- **Field**: `preview_image` (ImageField)
- **Upload Path**: `media/challenge_previews/`
- **Optional**: Can be blank/null
- **API Behavior**: Writable via API

### 4. Media Files Configuration
- Added `MEDIA_URL` and `MEDIA_ROOT` to settings.py
- Added media file serving in development mode
- Added Pillow to requirements.txt for image handling

## Migration Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create and Run Migrations
```bash
python manage.py makemigrations challenges
python manage.py migrate
```

### 3. Create Media Directory
```bash
mkdir -p media/challenge_previews
```

### 4. Test the Changes
```bash
# Start the server
python manage.py runserver

# Test palette validation in admin panel
# Try creating a challenge with palette: #FF5733,#33FF57,#3357FF
```

## API Changes

### Challenge Endpoint Response (Updated)
```json
{
  "id": 1,
  "title": "Simple Button",
  "description": "Create a centered blue button",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "palette": "#FF5733,#33FF57,#3357FF",
  "preview_image": "http://localhost:8000/media/challenge_previews/challenge1.png",
  "points": 100,
  "created_at": "2024-01-15T09:00:00Z"
}
```

### Palette Field Behavior
- **GET requests**: Palette is included in response
- **POST/PUT requests**: Palette field is ignored (read-only)
- **Admin panel**: Palette can be set and validated

### Palette Validation Rules
1. Must be comma-separated list of hex colors
2. Each color must start with `#`
3. Each color must have exactly 6 hex digits (0-9, A-F)
4. Valid examples:
   - `#FF5733`
   - `#FF5733,#33FF57`
   - `#FF5733,#33FF57,#3357FF`
5. Invalid examples:
   - `FF5733` (missing #)
   - `#FF57` (too short)
   - `#FF57333` (too long)
   - `#GGGGGG` (invalid hex)

## Testing Palette Validation

### Valid Palettes
```python
# Single color
palette = "#FF5733"

# Multiple colors
palette = "#FF5733,#33FF57,#3357FF"

# With spaces (will be stripped)
palette = "#FF5733, #33FF57, #3357FF"
```

### Invalid Palettes (Will Raise ValidationError)
```python
# Missing hash
palette = "FF5733"

# Wrong length
palette = "#FF57"

# Invalid characters
palette = "#GGGGGG"

# Mixed valid/invalid
palette = "#FF5733,INVALID"
```

## Rollback Instructions

If you need to rollback these changes:

1. Restore the old models.py (remove palette and preview_image fields)
2. Re-add leaderboard to INSTALLED_APPS
3. Re-add leaderboard URL to urls.py
4. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Notes

- The leaderboard module files are still present but inactive
- To completely remove leaderboard, delete the `backend/leaderboard/` directory
- Preview images are stored in `media/challenge_previews/`
- In production, configure proper media file serving (e.g., S3, CDN)
