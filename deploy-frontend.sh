#!/bin/bash

# Frontend Production Deployment Script
# Optimized build with Monaco editor support

echo "🚀 Starting production frontend build..."

# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the project for production
echo "🔨 Building frontend for production..."
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Production build successful!"
    echo "📁 Build output is in frontend/dist/"
    echo ""
    echo "🌐 To deploy to Netlify:"
    echo "1. Go to https://app.netlify.com/"
    echo "2. Drag and drop the frontend/dist folder"
    echo "3. Or use Netlify CLI: netlify deploy --prod --dir=dist"
    echo ""
    echo "🎯 Production optimizations applied:"
    echo "- Monaco Editor with enhanced configuration"
    echo "- Debug logs removed"
    echo "- API connection test removed"
    echo "- Console logging disabled in production"
    echo "- Optimized CSP for Monaco Editor"
    echo ""
    echo "📋 Monaco Editor features:"
    echo "- Enhanced HTML/CSS support"
    echo "- Custom dark theme"
    echo "- Intelligent fallback to textarea"
    echo "- Improved error handling"
    echo "- Better performance configuration"
else
    echo "❌ Build failed!"
    exit 1
fi