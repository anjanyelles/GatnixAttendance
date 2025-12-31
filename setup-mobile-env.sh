#!/bin/bash
# Setup mobile testing environment file

echo "📱 Setting up mobile testing environment..."
echo ""

# Get local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
else
    echo "❌ Could not detect OS. Please enter your IP manually:"
    read -p "Your local IP: " IP
fi

if [ -z "$IP" ]; then
    echo "❌ Could not find IP address."
    read -p "Please enter your local IP manually: " IP
fi

# Create .env.local file
ENV_FILE="frontend/.env.local"
echo "VITE_API_BASE_URL=http://$IP:3000/api" > "$ENV_FILE"

echo "✅ Created $ENV_FILE with:"
echo "   VITE_API_BASE_URL=http://$IP:3000/api"
echo ""
echo "🔧 IMPORTANT: Restart frontend server after this!"
echo "   Stop current frontend (Ctrl+C) and run: npm run dev"
echo ""
echo "🚀 Now start your services:"
echo "   Terminal 1: cd backend && npm start"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "📱 Access from mobile: http://$IP:5173"
echo ""
echo "🧪 Test backend from mobile:"
echo "   http://$IP:3000/health"
echo ""

