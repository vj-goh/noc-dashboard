#!/bin/bash
# Test API endpoints from dashboard container

echo "Testing networks/list..."
curl -s http://localhost:5173/api/devices/networks/list | jq '.count' || echo "FAIL"

echo ""
echo "Testing creating network..."
curl -X POST http://localhost:5173/api/devices/networks/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Network",
    "subnet": "192.168.1.0/24",
    "gateway": "192.168.1.1",
    "dns_servers": ["8.8.8.8"]
  }' 2>/dev/null | jq '.success' || echo "FAIL"

echo ""
echo "Testing dhcp/list..."
curl -s http://localhost:5173/api/devices/dhcp/list | jq '.count' || echo "FAIL"

echo ""
echo "Testing devices/list..."
curl -s http://localhost:5173/api/devices/devices/list | jq '.count' || echo "FAIL"
