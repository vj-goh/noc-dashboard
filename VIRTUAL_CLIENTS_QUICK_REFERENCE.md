# Virtual Clients System - Quick Reference

## Access the System

1. Start the NOC Dashboard: `docker-compose up -d`
2. Navigate to: `http://localhost:5174`
3. Click "🖥️ Virtual Devices" button

## Quick Workflow (5 minutes)

### 1. Create Network
```
Name:     "Test Network"
Subnet:   "10.0.1.0/24"
Gateway:  "10.0.1.1"
DNS:      "8.8.8.8"
```
Click: Create Network

### 2. Create DHCP
```
Network:      "Test Network"
Pool Start:   "10.0.1.10"
Pool End:     "10.0.1.254"
Lease Time:   3600
```
Click: Create DHCP Server

### 3. Create Device
```
Name:     "Test PC"
Type:     "Computer"
Networks: Check "Test Network"
```
Click: Create Device
→ Gets 10.0.1.10 automatically

### 4. Generate Traffic
```
Source:       "Test PC"
Traffic Type: "ICMP"
Destination:  "10.0.1.1"
Frequency:    5 seconds
```
Click: Start Traffic

### 5. Analyze
- Go to "🔍 PCAP Analyzer"
- See traffic from Test PC
- View packets/statistics

## Device Types

| Type | Icon | Use Case |
|------|------|----------|
| Computer | 💻 | Workstations, servers |
| Phone | 📱 | Mobile devices |
| Printer | 🖨️ | Network printers |

## Traffic Types

| Type | Port | Use |
|------|------|-----|
| HTTP | 80 | Web browsing |
| DNS | 53 | DNS queries |
| SSH | 22 | Remote access |
| FTP | 21 | File transfer |
| ICMP | N/A | Ping |
| Custom | Any | Custom traffic |

## Configuration Saved As

All settings auto-saved to:
- `data/virtual_networks.json`
- `data/dhcp_servers.json`
- `data/virtual_devices.json`
- `data/traffic_patterns.json`

(Persists across container restarts)

## Common Operations

### Assign Manual IP
```
Device Details → Interface → Edit
IP: 10.0.1.100
Network: Test Network
Click: Assign
```

### Stop Traffic
```
Click "Stop" button on active pattern
```

### Delete Device
```
Click "Delete" on device card
Stops traffic automatically
```

### View DHCP Leases
```
Click on DHCP server entry
Shows all active leases
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No DHCP server" | Create DHCP server for network first |
| "IP not in subnet" | Manual IP must be in network range |
| No traffic showing | Check PCAP Analyzer for captures |
| Device won't create | Select at least one network |

## API Endpoints

```
# Networks
POST   /api/devices/networks/create
GET    /api/devices/networks/list
GET    /api/devices/networks/{id}
DELETE /api/devices/networks/{id}

# DHCP
POST /api/devices/dhcp/create
GET  /api/devices/dhcp/list
GET  /api/devices/dhcp/{id}/leases

# Devices
POST   /api/devices/devices/create
GET    /api/devices/devices/list
GET    /api/devices/devices/{id}
POST   /api/devices/devices/{id}/assign-ip
DELETE /api/devices/devices/{id}

# Traffic
POST /api/devices/traffic/start?device_id=...
POST /api/devices/traffic/{id}/stop
GET  /api/devices/traffic/{id}/stats
```

## Network Planning

### Small Lab (5 devices)
```
Network: 10.0.1.0/24
Pool: 10.0.1.10 - 10.0.1.50
Devices: 5
```

### Medium Lab (20 devices)
```
Network 1: 10.0.1.0/24 (devices)
Network 2: 10.0.2.0/24 (servers)
Network 3: 10.0.3.0/24 (printers)
Devices: 20 total
```

### Large Lab (100+ devices)
```
Use multiple /25 subnets
Or expand to /23 networks
Config DHCP pools per network
```

## Performance Tips

1. **Refresh Rate**: 5 seconds default (safe)
2. **Max Devices**: 50 per network (recommended)
3. **Traffic Patterns**: Start with 5-10 per device
4. **Storage**: JSON grows with activity, monitor size
5. **CPU**: Traffic threads use minimal CPU

## Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Network creation | ✅ | Full CIDR support |
| DHCP servers | ✅ | Automatic IP allocation |
| Device types | ✅ | 3 types (computer, phone, printer) |
| Manual IPs | ✅ | With validation |
| Traffic generation | ✅ | 6 types supported |
| Traffic capture | ✅ | Via existing PCAP system |
| Traffic analysis | ✅ | Via PCAP Analyzer |
| Multi-interface | ✅ | Devices can join multiple networks |
| Persistent storage | ✅ | JSON-based |
| Activity logging | ✅ | Real-time on UI |

## Next Steps

### Try These Scenarios

1. **Basic Connectivity**
   - 2 networks, 2 devices, ping traffic

2. **DHCP Pool Test**
   - Create 10 devices, verify IPs assigned

3. **Multi-Protocol**
   - Single device sending HTTP + DNS + SSH

4. **Mixed Types**
   - Computer + Phone + Printer in same network

5. **Traffic Analysis**
   - Generate traffic, analyze in PCAP Analyzer

## Documentation Files

- `VIRTUAL_DEVICES_GUIDE.md` - Full implementation guide
- `VIRTUAL_CLIENTS_IMPLEMENTATION_SUMMARY.md` - Complete summary
- This file - Quick reference
- `/api/docs` - API documentation (Swagger)

## Support Checklist

- [ ] Can create networks
- [ ] Can create DHCP servers
- [ ] Can create devices (get IPs)
- [ ] Can generate traffic
- [ ] Can see traffic in PCAP Analyzer
- [ ] Can stop traffic
- [ ] Can delete devices
- [ ] Can manually assign IPs
- [ ] Activity log shows operations
- [ ] Data persists after restart

**All items checked? System is working! 🎉**

---

**Quick Ref v1.0** | Generated: Dec 19, 2025
