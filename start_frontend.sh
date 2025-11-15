#!/bin/bash
cd "$(dirname "$0")"
echo "⚛️ Starting Banking Bot Frontend..."
echo "📍 Frontend URL: http://localhost:3000"
echo "🔄 Backend API: http://localhost:2024"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Make sure the backend is running before using the frontend!"
echo ""
npm run dev
