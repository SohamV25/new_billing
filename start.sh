#!/bin/bash
# start.sh — Start the entire MERN Billing App
# Run this ONCE to fix the MongoDB socket permission issue and start everything.

set -e

echo "🔧 Fixing MongoDB socket permission..."
sudo rm -f /tmp/mongodb-27017.sock

echo "📁 Creating MongoDB data directory..."
mkdir -p ~/data/db

echo "🍃 Starting MongoDB in background..."
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongo.log
sleep 3

echo "🌱 Seeding customer database..."
cd "$(dirname "$0")/server" && npm run seed

echo "🚀 Starting API server (port 5000)..."
npm start &
SERVER_PID=$!

echo "⚡ Starting React client (port 5173)..."
cd "$(dirname "$0")/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "────────────────────────────────────────"
echo "✅ Both servers are running!"
echo "   Dashboard:  http://localhost:5173"
echo "   API Server: http://localhost:5000"
echo "────────────────────────────────────────"
echo "Press Ctrl+C to stop both servers."

wait
