# Backend Changes Summary

## Overview
Modified the CSSBattle backend to remove leaderboard functionality and add palette validation with preview images.

## Files Modified

### 1. `backend/challenges/models.py`
**Changes:**
- Added `validate_palette()` function for hex color validation
- Added `palette` field (CharField with validation)
- Added `preview_image` field (ImageField)
- Added `clean()` method for model-level validation

**New Fields:**
```python
palette = models.CharField(
    max_length=500,
    blank=True,
    validators=[validate_palette],
    help_text="Comma-separated hex colors (e.g., #FF5733,#33FF57,#3357FF)"
)

preview_image = models.ImageField(
    upload_to='challenge_previews/',
    blank=True,
    null=True,
    help_text="Preview image for the challenge"
)
```

### 2. `backend/challenges/serializers.py`
**Changes:**
- Added `palette` field as read-only
- Added `preview_image` field
- Updated `fields` list to include new fields
- Updated `read_only_fields` to include `palette`

### 3. `backend/challenges/admin.py`
**Changes:**
- Added `palette` to `list_display`
- Added new fieldset "Visual Assets" for palette and preview_image
- Added description for palette format

### 4. `backend/backend/settings.py`
**Changes:**
- Removed `'leaderboard'` from `INSTALLED_APPS`
- Added `MEDIA_URL` and `MEDIA_ROOT` configuration

### 5. `backend/backend/urls.py`
**Changes:**
- Removed `/api/leaderboard/` route
- Added media file serving for development mode

### 6. `backend/requirements.txt`
**Changes:**
- Added `Pillow==10.1.0` for image handling

## Features Added

### Palette Validation
- Validates comma-separated hex color format
- Pattern: `#RRGGBB,#RRGGBB,#RRGGBB`
- Each color must be exactly 6 hex digits
- Validation occurs at both field and model level
- **Read-only in API** - can only be set through admin panel

### Preview Image
- Supports image uploads for challenges
- Stored in `media/challenge_previews/`
- Optional field (can be blank/null)
- Accessible via API

## Features Removed

### Leaderboard Module
- Removed from INSTALLED_APPS
- Removed API endpoint `/api/leaderboard/`
- Module files still exist but are inactive
- Can be deleted if no longer needed

## Next Steps

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create migrations:**
   ```bash
   python manage.py makemigrations challenges
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create media directory:**
   ```bash
   mkdir -p media/challenge_previews
   ```

5. **Test the changes:**
   - Start server: `python manage.py runserver`
   - Access admin panel: http://localhost:8000/admin/
   - Create a challenge with palette: `#FF5733,#33FF57,#3357FF`
   - Upload a preview image
   - Verify API response includes palette (read-only) and preview_image

## API Example

### GET /api/challenges/1/
```json
{
  "id": 1,
  "title": "Colorful Button",
  "description": "Create a button using the provided palette",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "palette": "#FF5733,#33FF57,#3357FF",
  "preview_image": "http://localhost:8000/media/challenge_previews/button.png",
  "points": 100,
  "created_at": "2024-02-28T10:00:00Z"
}
```

### POST /api/challenges/ (Admin only)
```json
{
  "title": "New Challenge",
  "description": "Description here",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "points": 150
}
```
Note: `palette` field will be ignored in POST/PUT requests (read-only)

## Validation Examples

### Valid Palettes ✅
- `#FF5733`
- `#FF5733,#33FF57`
- `#FF5733,#33FF57,#3357FF`
- `#FF5733, #33FF57, #3357FF` (spaces are stripped)

### Invalid Palettes ❌
- `FF5733` (missing #)
- `#FF57` (too short)
- `#FF57333` (too long)
- `#GGGGGG` (invalid hex characters)
- `rgb(255,87,51)` (wrong format)

## Testing Checklist

- [ ] Install Pillow dependency
- [ ] Run migrations successfully
- [ ] Create media directory
- [ ] Admin panel shows palette and preview_image fields
- [ ] Palette validation works in admin (try invalid format)
- [ ] Preview image upload works
- [ ] API returns palette field (read-only)
- [ ] API returns preview_image URL
- [ ] Leaderboard endpoint returns 404
- [ ] No errors in server logs
