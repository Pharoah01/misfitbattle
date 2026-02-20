#!/bin/bash

echo "=== CSSBattle Backend Setup ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please edit it with your configuration."
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate
echo "✓ Migrations completed"
echo ""

# Create superuser prompt
echo "Do you want to create a superuser? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    python manage.py createsuperuser
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the development server, run:"
echo "  python manage.py runserver"
echo ""
echo "To start the production server, run:"
echo "  gunicorn -c gunicorn.conf.py backend.wsgi:application"
echo ""
echo "Admin panel: http://localhost:8000/admin/"
echo "API base URL: http://localhost:8000/api/"
