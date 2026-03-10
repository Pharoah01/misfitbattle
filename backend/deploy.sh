#!/bin/bash
# Misfits Battle - Deployment Script
# Run this script on your EC2 instance after initial setup

set -e  # Exit on error

echo "================================"
echo "Misfits Battle Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as misfits user
if [ "$USER" != "misfits" ]; then
    echo -e "${RED}Error: This script must be run as the 'misfits' user${NC}"
    echo "Run: sudo su - misfits"
    exit 1
fi

# Check if in correct directory
if [ ! -f "manage.py" ]; then
    echo -e "${RED}Error: manage.py not found. Are you in the backend directory?${NC}"
    echo "Run: cd /opt/misfits/MisfitsBattle/backend"
    exit 1
fi

echo -e "${GREEN}✓ Running as correct user in correct directory${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3.11 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install/update dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install gunicorn -q
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.production .env
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env file and set:${NC}"
    echo "  - SECRET_KEY (generate with: python3 -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\")"
    echo "  - FRONTEND_URL"
    echo "  - CORS_ALLOWED_ORIGINS"
    echo ""
    read -p "Press Enter after you've edited .env file..."
fi

# Check if SECRET_KEY is set
if grep -q "REPLACE_WITH_GENERATED_SECRET_KEY" .env; then
    echo -e "${RED}Error: SECRET_KEY not set in .env file${NC}"
    echo "Generate one with: python3 -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
    exit 1
fi

echo -e "${GREEN}✓ .env file configured${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
python manage.py migrate
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Collect static files
echo -e "${YELLOW}Collecting static files...${NC}"
python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"
echo ""

# Create superuser if needed
echo -e "${YELLOW}Checking for superuser...${NC}"
python manage.py shell -c "from users.models import User; exit(0 if User.objects.filter(is_superuser=True).exists() else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}No superuser found. Creating one...${NC}"
    python manage.py createsuperuser
else
    echo -e "${GREEN}✓ Superuser already exists${NC}"
fi
echo ""

# Create media directories
echo -e "${YELLOW}Creating media directories...${NC}"
mkdir -p media/challenge_previews
mkdir -p media/submission_renders
echo -e "${GREEN}✓ Media directories created${NC}"
echo ""

# Test Django configuration
echo -e "${YELLOW}Testing Django configuration...${NC}"
python manage.py check
echo -e "${GREEN}✓ Django configuration OK${NC}"
echo ""

echo "================================"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Exit misfits user: exit"
echo "2. Setup Gunicorn service:"
echo "   sudo cp /opt/misfits/MisfitsBattle/backend/gunicorn.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable gunicorn"
echo "   sudo systemctl start gunicorn"
echo ""
echo "3. Setup Nginx:"
echo "   sudo cp /opt/misfits/MisfitsBattle/backend/nginx.conf /etc/nginx/sites-available/misfits-battle"
echo "   sudo ln -s /etc/nginx/sites-available/misfits-battle /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "4. Get SSL certificate:"
echo "   sudo certbot --nginx -d api.binarymisfits.info"
echo ""
echo "5. Test your deployment:"
echo "   curl https://api.binarymisfits.info/health"
echo ""
