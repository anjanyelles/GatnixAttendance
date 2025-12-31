#!/bin/bash
# Quick script to get your local IP address for mobile testing

echo "🔍 Finding your local IP address..."
echo ""

# Try different methods based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    IP=$(ipconfig | grep "IPv4" | awk '{print $14}' | head -1)
else
    echo "❌ Could not detect OS. Please find your IP manually."
    exit 1
fi

if [ -z "$IP" ]; then
    echo "❌ Could not find IP address. Please check your network connection."
    exit 1
fi

echo "✅ Your local IP address is: $IP"
echo ""
echo "📱 To access from mobile:"
echo "   Frontend: http://$IP:5173"
echo "   Backend:  http://$IP:3000"
echo ""
echo "💡 Make sure:"
echo "   1. Mobile device is on the same WiFi network"
echo "   2. Firewall allows connections on ports 5173 and 3000"
echo "   3. Update frontend/.env.local with: VITE_API_BASE_URL=http://$IP:3000/api"
echo ""

