#!/bin/bash
# Run both API server and Vite frontend

echo "🚀 Starting CarCredit Development Server..."
echo ""
echo "📡 API Server: http://localhost:3001"
echo "🎨 Frontend:   http://localhost:5173"
echo ""

# Start API server in background
echo "📡 Starting API server on port 3001..."
PORT=3001 node test-server-only.js &
API_PID=$!

# Wait for API server to start
sleep 2

# Start Vite frontend
echo "🎨 Starting Vite frontend on port 5173..."
npx vite

# Cleanup on exit
trap "kill $API_PID 2>/dev/null" EXIT
