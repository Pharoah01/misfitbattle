@echo off
REM Migration script for palette feature (Windows)

echo ==========================================
echo Backend Palette Feature Migration
echo ==========================================
echo.

REM Check if we're in the backend directory
if not exist "manage.py" (
    echo Error: Please run this script from the backend directory
    exit /b 1
)

echo Step 1: Installing dependencies...
pip install -r requirements.txt

echo.
echo Step 2: Creating migrations...
python manage.py makemigrations challenges

echo.
echo Step 3: Running migrations...
python manage.py migrate

echo.
echo Step 4: Creating media directory...
if not exist "media\challenge_previews" mkdir media\challenge_previews

echo.
echo Step 5: Testing palette validation...
python test_palette_validation.py

echo.
echo ==========================================
echo Migration completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Start the server: python manage.py runserver
echo 2. Access admin panel: http://localhost:8000/admin/
echo 3. Create a challenge with palette: #FF5733,#33FF57,#3357FF
echo 4. Upload a preview image
echo 5. Test API: http://localhost:8000/api/challenges/
echo.
