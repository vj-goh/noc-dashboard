#!/bin/bash

# NOC Dashboard Startup Script
# This script helps you get the NOC Dashboard up and running quickly

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 NOC Dashboard - Network Operations Center"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/scanner
mkdir -p logs/radius
mkdir -p data

echo "✅ Directories created"
echo ""

# Pull images
echo "📥 Pulling Docker images (this may take a few minutes)..."
docker-compose pull

echo "✅ Images pulled successfully"
echo ""

# Build custom images
echo "🔨 Building custom images..."
docker-compose build

echo "✅ Images built successfully"
echo ""

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Containers started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker-compose ps
echo ""

# Display access information
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 NOC Dashboard is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Web Dashboard:     http://localhost:5173"
echo "🔐 RADIUS Server:     10.0.1.10 (ports 1812/1813)"
echo "📡 DNS Server:        10.0.1.40 (port 53)"
echo ""
echo "Quick Commands:"
echo "  View logs:          docker-compose logs -f"
echo "  Stop all:           docker-compose down"
echo "  Restart:            docker-compose restart"
echo "  Access router:      docker exec -it noc_router1 vtysh"
echo "  Access scanner:     docker exec -it noc_scanner bash"
echo ""
echo "📖 For more information, see README.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"