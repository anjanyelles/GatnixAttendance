#!/bin/bash

# GatnixAttendance Deployment Script
# This script helps prepare your application for deployment

echo "🚀 GatnixAttendance Deployment Helper"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the GatnixAttendance root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Pre-deployment Checks:"
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js v16 or higher"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

echo ""
echo "📦 Installing Dependencies:"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in backend directory"
    echo "   Please create .env file with your configuration"
    echo "   See DEPLOYMENT.md for required variables"
else
    echo "✅ .env file found"
fi

npm install --production
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env or .env.production file found"
    echo "   Please create .env.production with VITE_API_BASE_URL"
else
    echo "✅ Environment file found"
fi

npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
echo ""
echo "🏗️  Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
    echo "   Build output: frontend/dist"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Review DEPLOYMENT.md for platform-specific instructions"
echo "2. Ensure all environment variables are set correctly"
echo "3. Test your backend: cd backend && npm start"
echo "4. Test your frontend build: cd frontend && npm run preview"
echo ""
echo "🌐 Quick Deploy Options:"
echo "- Railway: See QUICK_DEPLOY.md"
echo "- Vercel (Frontend) + Railway (Backend): See QUICK_DEPLOY.md"
echo "- VPS/Server: See DEPLOYMENT.md"
echo ""

