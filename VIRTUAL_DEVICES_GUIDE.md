# Virtual Client Configuration System - Implementation Guide

## Overview

This document outlines the newly implemented virtual client configuration system for the NOC Dashboard. The system allows you to:

1. **Create Virtual Networks** - Define isolated network segments with subnets
2. **Configure DHCP Servers** - Provide automatic IP assignment for networks
3. **Create Virtual Devices** - Deploy phones, printers, and computers
4. **Generate Traffic** - Simulate realistic network traffic patterns
5. **Capture Packets** - Analyze traffic on virtual router interfaces

## Architecture

### Backend Components

#### 1. **Models** (`app/models.py`)
New Pydantic models for virtual infrastructure:
- `NetworkInfo` - Virtual network definition (subnet, gateway, DNS)
- `DHCPServerConfig` - DHCP configuration with IP pool
- `VirtualDevice` - Device representation (type, interfaces, status)
- `DeviceInterface` - Network interface on device (IP, MAC, network)
- `TrafficPattern` - Traffic generation specification (type, destination, frequency)
- `TrafficPatternInstance` - Active traffic generation (packets, bytes, timing)

#### 2. **Services** (`app/services/virtual_infrastructure.py`)
`VirtualInfrastructureManager` class with methods for:
- **Network Management**
  - `create_network()` - Create new network with CIDR validation
  - `list_networks()` - Get all networks
  - `delete_network()` - Remove network (with safety checks)

- **DHCP Management**
  - `create_dhcp_server()` - Set up DHCP for network with IP pool
  - `get_dhcp_leases()` - Get active leases for devices
  - `_allocate_dhcp_ip()` - Allocate next available IP from pool

- **Device Management**
  - `create_device()` - Create device with multiple interfaces
  - `list_devices()` - Get all devices
  - `assign_manual_ip()` - Manually assign IP (validates network)
  - `delete_device()` - Remove device and stop traffic

- **Traffic Generation**
  - `start_traffic_patterns()` - Begin traffic generation
  - `stop_traffic_pattern()` - Stop pattern
  - `get_traffic_stats()` - Get pattern statistics
  - Support for: HTTP, DNS, SSH, FTP, ICMP, Custom

- **Helpers**
  - `_validate_subnet()` - CIDR format validation
  - `_validate_ip_in_subnet()` - IP range validation
  - `_generate_mac()` - Random MAC generation
  - Persistent JSON-based storage

#### 3. **Routes** (`app/api/routes/devices.py`)
RESTful API endpoints:
- `POST /networks/create` - Create network
- `GET /networks/list` - List networks
- `GET /networks/{id}` - Get network details
- `DELETE /networks/{id}` - Delete network

- `POST /dhcp/create` - Create DHCP server
- `GET /dhcp/list` - List DHCP servers
- `GET /dhcp/{id}/leases` - Get DHCP leases

- `POST /devices/create` - Create device
- `GET /devices/list` - List devices
- `GET /devices/{id}` - Get device details
- `POST /devices/{id}/assign-ip` - Assign manual IP
- `DELETE /devices/{id}` - Delete device

- `POST /traffic/start` - Start traffic generation
- `POST /traffic/{id}/stop` - Stop traffic pattern
- `GET /traffic/{id}/stats` - Get pattern statistics

- `GET /device-types` - Available device types
- `GET /traffic-types` - Available traffic types

### Frontend Components

#### 1. **Configuration Page** (`dashboard/devices.html`)
Modern UI with sections for:
- Network creation and management
- DHCP server configuration
- Device creation and management
- Traffic pattern generation
- Real-time activity log

#### 2. **JavaScript Handler** (`dashboard/devices.js`)
Functions for:
- Loading and syncing data from API
- Creating networks, DHCP servers, devices
- Generating traffic patterns
- Real-time status updates
- Activity logging with timestamps

## Workflow

### Step 1: Create Virtual Networks

1. Navigate to "🖥️ Virtual Devices" from main dashboard
2. Go to "📡 Virtual Networks" section
3. Enter network details:
   - **Name**: e.g., "Management Network"
   - **Subnet**: CIDR notation (e.g., `10.0.1.0/24`)
   - **Gateway**: IP for gateway (e.g., `10.0.1.1`)
   - **DNS Servers**: Comma-separated (default: 8.8.8.8, 8.8.4.4)
4. Click "Create Network"
5. Network appears in "Active Networks" list

### Step 2: Create DHCP Servers

1. Go to "🔄 DHCP Servers" section
2. **Select Network**: Choose from networks created in Step 1
3. Enter DHCP details:
   - **Pool Start**: First IP in pool (e.g., `10.0.1.10`)
   - **Pool End**: Last IP in pool (e.g., `10.0.1.254`)
   - **Lease Time**: Default 3600s (1 hour)
   - **Gateway**: Auto-populated from network
4. Click "Create DHCP Server"
5. DHCP server appears in list with lease information

**Important**: DHCP server must exist before devices can use DHCP on that network

### Step 3: Create Virtual Devices

1. Go to "🖥️ Virtual Devices" section
2. Enter device information:
   - **Name**: e.g., "Marketing PC", "HP Printer"
   - **Type**: Computer (💻), Phone (📱), or Printer (🖨️)
   - **Networks**: Select one or more networks to connect
3. Click "Create Device"
4. Device appears with:
   - Status indicator (green = running)
   - List of interfaces with IPs
   - MAC addresses
   - Connection status

**Network Configuration**:
- By default, devices use DHCP
- IPs automatically allocated from DHCP pool
- Multiple interfaces = connection to multiple networks

### Step 4: Assign Manual IPs (Optional)

To override DHCP with static IP:

1. Click "Details" on a device
2. Use the `POST /devices/{id}/assign-ip` endpoint with:
   - Interface name (e.g., eth0)
   - IP address (must be in network subnet)
   - Network ID (must match interface's network)
3. IP is validated against network range
4. DHCP is disabled for that interface

### Step 5: Generate Traffic

1. Go to "🌐 Traffic Generation" section
2. Configure traffic pattern:
   - **Source Device**: Device to send traffic from
   - **Traffic Type**: HTTP, DNS, SSH, FTP, ICMP, Custom
   - **Destination**: Target IP address
   - **Port**: Destination port (auto-set by type)
   - **Frequency**: Seconds between packets
   - **Duration**: Total time (empty = infinite)
   - **Packet Size**: Bytes per packet
3. Click "Start Traffic"
4. Pattern appears in "Active Traffic Patterns" with:
   - Type and destination
   - Packets/bytes sent
   - Current status
   - Stop button

### Step 6: Capture and Analyze Traffic

1. Traffic is automatically captured on virtual router interfaces
2. Go to "🔍 PCAP Analyzer" from main dashboard
3. Upload or select recent capture
4. View:
   - Protocol statistics
   - Top conversations
   - DNS queries
   - Packet details
5. Export as JSON/CSV

## Device Types

### Computer (💻)
- General-purpose network node
- Can run any traffic pattern
- Typical use: workstations, servers

### Phone (📱)
- Mobile device simulation
- Can run HTTP, DNS, ICMP
- Typical use: mobile clients

### Printer (🖨️)
- Print server simulation
- Can run HTTP (web interface), LPD, IPP
- Typical use: network printing

All types function identically - labels for variety and organization.

## Traffic Types

### HTTP (Port 80)
- Web browsing simulation
- TCP-based
- Realistic packet sizes (~512-1500 bytes)

### DNS (Port 53)
- Domain name queries
- UDP-based
- Small packets (~100-200 bytes)

### SSH (Port 22)
- Remote access simulation
- TCP-based
- Frequent small packets

### FTP (Port 21)
- File transfer simulation
- TCP-based
- Variable packet sizes

### ICMP
- Ping/echo requests
- No port needed
- Small packets (~64 bytes)

### Custom
- User-defined traffic
- Specify any port/protocol
- Flexible packet configuration

## Traffic Capture Integration

The system integrates with existing packet capture:

1. **Router Interfaces** - Virtual routers have interfaces on each network
2. **tcpdump** - Scanner container runs tcpdump on router interfaces
3. **PCAP Files** - Captured packets stored in `/data` directory
4. **Analysis** - Use PCAP Analyzer to examine device traffic

**Traffic Flow**:
```
Device generates traffic 
  → Sent to network
  → Captured by router interface
  → tcpdump writes to PCAP file
  → Analyzer reads and displays results
```

## Data Storage

All configuration is persisted in JSON files:

- `virtual_networks.json` - Network definitions
- `dhcp_servers.json` - DHCP configurations
- `virtual_devices.json` - Device configurations
- `traffic_patterns.json` - Traffic patterns and statistics

Files are stored in `/api/data/` directory (Docker mapped volume).

## Workflow Example

### Scenario: Test LAN Traffic

```
1. Create "Lab Network" (10.0.1.0/24, gateway 10.0.1.1)
   ↓
2. Create DHCP server (10.0.1.10 - 10.0.1.254)
   ↓
3. Create 3 devices:
   - "Lab PC 1" (type: computer)
   - "Lab PC 2" (type: computer)
   - "Printer" (type: printer)
   ↓
4. Generate traffic:
   - PC 1 → Printer (HTTP, port 80, 10s interval)
   - PC 1 → PC 2 (SSH, port 22, 5s interval)
   - PC 2 → DNS (DNS, port 53, 30s interval)
   ↓
5. Capture traffic on router interface
   ↓
6. Analyze in PCAP Analyzer
   - See protocol distribution
   - Identify top conversations
   - Verify DNS queries
```

## API Response Examples

### Create Network
```json
{
  "success": true,
  "message": "Network created successfully",
  "network": {
    "id": "net_a1b2c3d4",
    "name": "Management Network",
    "subnet": "10.0.1.0/24",
    "gateway": "10.0.1.1",
    "dns_servers": ["8.8.8.8", "8.8.4.4"],
    "created_at": "2025-12-19T10:30:00",
    "status": "active"
  }
}
```

### Create DHCP Server
```json
{
  "success": true,
  "message": "DHCP server created successfully",
  "server": {
    "id": "dhcp_x7y8z9w0",
    "network_id": "net_a1b2c3d4",
    "subnet": "10.0.1.0/24",
    "range_start": "10.0.1.10",
    "range_end": "10.0.1.254",
    "lease_time": 3600,
    "gateway": "10.0.1.1",
    "status": "running"
  }
}
```

### Create Device
```json
{
  "success": true,
  "message": "Device created successfully",
  "device": {
    "id": "dev_m1n2o3p4",
    "name": "Marketing PC",
    "device_type": "computer",
    "interfaces": [
      {
        "name": "eth0",
        "network_id": "net_a1b2c3d4",
        "mac_address": "02:42:0a:00:01:0a",
        "ip_address": "10.0.1.10",
        "dhcp_enabled": true,
        "status": "up"
      }
    ],
    "status": "running",
    "active_traffic_patterns": [],
    "created_at": "2025-12-19T10:35:00"
  }
}
```

### Start Traffic
```json
{
  "success": true,
  "message": "Traffic patterns started successfully",
  "device_id": "dev_m1n2o3p4",
  "pattern_id": "pat_q1r2s3t4"
}
```

## Validation Rules

### Network Subnet
- Must be valid CIDR notation (e.g., `10.0.0.0/24`)
- Gateway must be in subnet range
- No overlapping subnets allowed

### IP Addresses
- Must be valid IPv4 format
- Must be within network's subnet
- Manual IPs cannot conflict with existing devices
- DHCP pool must not include gateway

### Device Creation
- At least one network must be selected
- Network DHCP server must exist if using DHCP
- Devices can connect to multiple networks

### Traffic Patterns
- Destination must be reachable from source device's network
- Port validation (1-65535)
- Frequency >= 1 second
- Optional duration for finite traffic

## Troubleshooting

### "No DHCP server for network"
- **Cause**: Network exists but DHCP not configured
- **Solution**: Create DHCP server for network in Step 2

### "IP not in subnet"
- **Cause**: Manually assigned IP outside network range
- **Solution**: Verify IP is within subnet CIDR

### "Network not found"
- **Cause**: Network ID doesn't exist
- **Solution**: Create network first

### Traffic not showing in PCAP
- **Cause**: Router interface not capturing
- **Solution**: Verify device has valid IP on network

### Device shows "DHCP" but no IP
- **Cause**: DHCP pool exhausted
- **Solution**: Extend DHCP pool or delete unused devices

## Future Enhancements

Potential improvements for next phase:

1. **Network Bridges** - Connect networks together
2. **Advanced Traffic Types** - BitTorrent, Video Streaming
3. **QoS Simulation** - Bandwidth throttling, jitter
4. **Packet Loss** - Simulate lossy networks
5. **Latency** - Add realistic delays
6. **VLANs** - Virtual LAN support
7. **Route Injection** - Custom routing rules
8. **Scheduled Traffic** - Time-based patterns
9. **Traffic Capture Filtering** - Selective PCAP by device
10. **Performance Metrics** - Throughput, latency graphs

## Support

For issues or questions:

1. Check Activity Log on devices page for error messages
2. Review browser console for JavaScript errors
3. Check API logs: `docker logs noc_api`
4. Verify network connectivity with ping
5. Check DHCP leases in DHCP Servers section
