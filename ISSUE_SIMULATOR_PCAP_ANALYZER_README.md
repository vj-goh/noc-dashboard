# NOC Dashboard - Network Issue Simulator & PCAP Analyzer Implementation

## Overview

This document outlines the new features implemented for the NOC Dashboard, including a comprehensive network issue simulator and a full-featured PCAP analyzer.

## Features Implemented

### 1. Network Issue Simulator

Located in **Troubleshooting Suite** (`/troubleshooting.html`)

The issue simulator allows you to test network troubleshooting procedures by simulating various network failures:

#### Available Issues to Simulate:

1. **BGP Session Down** (Critical)
   - Simulates BGP peer becoming unreachable
   - Layer 3 (Network Layer)
   - Returns Idle state for BGP peers

2. **RADIUS Authentication Failure** (High)
   - Simulates RADIUS server timeout
   - Layer 7 (Application Layer)
   - Returns authentication failures

3. **DNS Resolution Timeout** (Medium)
   - Simulates slow/unresponsive DNS
   - Layer 7 (Application Layer)
   - Returns DNS query timeouts (>2000ms)

4. **High Packet Loss on Link** (High)
   - Simulates 25% packet loss
   - Layer 2 (Data Link Layer)
   - Returns high packet loss percentage

5. **Interface Down** (Critical)
   - Simulates network interface failure
   - Layer 1 (Physical Layer)
   - Returns interface status as DOWN

#### How to Use:

1. Navigate to **Troubleshooting Suite** from the main dashboard
2. Scroll to **Network Issue Simulator** section
3. Click **Trigger Issue** on any of the issue cards
4. The system will:
   - Activate the issue
   - Update the OSI layer status
   - Patch API responses to simulate the failure
   - Log the issue to the active issues list

5. Use the diagnostic tools above to troubleshoot
6. Click **Reset Environment** to clear all issues

#### What Actually Happens:

When you trigger an issue:
- The frontend intercepts API calls and returns simulated failure responses
- Diagnostic tools will show the failure when queried
- The layer health cards update to show "⚠️ Issue Detected"
- A timer shows how long the issue has been active

### 2. PCAP Analyzer

Located at **PCAP Analyzer** page (`/pcap-analysis.html`)

A comprehensive packet capture analyzer with real-time visualization of network traffic.

#### Features:

**File Upload & Management:**
- Drag-and-drop PCAP file upload
- File browser for recently captured files
- Support for .pcap and .pcapng formats

**Analysis Results Display:**

- **Summary Statistics:**
  - Total packets captured
  - Capture duration
  - Total data transferred
  - Packets per second
  - Unique DNS queries
  - TCP flows count

- **Protocol Distribution:**
  - Visual bar chart showing protocol breakdown
  - Percentage distribution
  - Support for: IPv4, IPv6, TCP, UDP, ICMP, DNS, ARP

- **Top Conversations:**
  - IP source and destination pairs
  - Packet count per conversation
  - Total bytes transferred
  - Percentage of total traffic

- **DNS Query Log:**
  - List of DNS lookups (queries only)
  - Query frequency
  - Top 50 queries shown

- **Export Options:**
  - JSON export for detailed analysis
  - CSV export for conversation data

#### How to Use:

1. Navigate to **PCAP Analyzer** from dashboard or troubleshooting suite
2. **Upload a PCAP file:**
   - Click upload area or drag & drop
   - Or click "Load Captures" to select from previous scans

3. **View Analysis:**
   - Results appear automatically after upload
   - Scroll through statistics and charts
   - Tables show detailed conversation data

4. **Export Data:**
   - Click "Export JSON" for full analysis data
   - Click "Export CSV" for conversation summary

#### API Endpoints:

- `GET /api/network/capture/list` - List available PCAP files
- `POST /api/network/capture/analyze?filename=...` - Analyze a PCAP file
- `POST /api/network/capture/start` - Start new packet capture
- `GET /api/network/capture/download/{filename}` - Download PCAP file

## Backend Implementation

### New Service: PCAP Analyzer

**File:** `app/services/pcap_analyzer.py`

Implemented using Scapy library with the following capabilities:

```python
class PCAPAnalyzer:
    - analyze() - Extract all packet metrics
    - get_summary() - Human-readable summary
    - get_protocol_breakdown() - Protocol statistics
    - get_conversations() - Top talkers
    - get_dns_queries() - DNS lookups
    - get_tcp_flows() - TCP stream analysis
    - export_json() - Complete JSON export
```

### Updated Network Route

**File:** `app/api/routes/network.py`

Enhanced `/capture/analyze` endpoint now:
- Uses real PCAP analyzer via Scapy
- Provides detailed traffic analysis
- Returns comprehensive JSON response
- Better error handling

### Frontend Integration

**Files Modified:**
- `troubleshooting.html` - Added issue simulator UI section
- `troubleshooting.js` - Implemented issue simulator logic
- `pcap-analysis.html` - Created new PCAP analyzer page
- `index.html` - Added navigation links
- `pcap-viewer.js` - Existing script enhanced

## Technical Details

### Issue Simulator Architecture

The issue simulator works by:

1. **Interception:** Wraps the native `fetch()` function
2. **Detection:** Checks if an issue is active for the requested URL
3. **Simulation:** Returns mock failure responses matching the issue type
4. **Restoration:** Can restore original fetch by resetting

```javascript
// Example: When 'bgp-down' is active and /api/network/bgp/summary is called
// Instead of the real response, the system returns:
{
    success: true,
    peers: [{ peer_ip: '10.0.2.2', state: 'Idle', peer_as: 65002 }]
}
```

### PCAP Analyzer Architecture

The analyzer processes packets using Scapy and creates several dictionaries:

1. **Protocols** - Counter of each protocol type
2. **Conversations** - IP pairs and their traffic volume
3. **DNS Queries** - Counter of DNS lookups
4. **TCP/UDP Streams** - Flow-based grouping
5. **Metrics** - Duration, packet size, flow count

## Navigation

```
Main Dashboard (index.html)
├── 🔧 Troubleshooting Suite (troubleshooting.html)
│   ├── Issue Simulator
│   ├── Diagnostic Tools
│   └── Active Issues
└── 🔍 PCAP Analyzer (pcap-analysis.html)

Troubleshooting Suite
└── 🔍 PCAP Analyzer

PCAP Analyzer
└── 🔧 Troubleshooting Suite
```

## Cleanup

### Redundant Files

The file `issue-simulator.js` is now **redundant** and can be removed. Its functionality has been fully integrated into `troubleshooting.js`.

```bash
# To remove:
rm dashboard/issue-simulator.js
```

## Testing

### Test Issue Simulator:

1. Open Troubleshooting Suite
2. Trigger "BGP Session Down"
3. Note the active issue appears
4. Notice layer L3 status changes to "⚠️ Issue Detected"
5. Run "View BGP Summary" - should show Idle state
6. Click "Reset Environment"
7. Run "View BGP Summary" again - should return to normal

### Test PCAP Analyzer:

1. Open PCAP Analyzer
2. Click "Load Captures" (if any exist)
3. Or create a simple test file
4. Click "Analyze"
5. Verify statistics appear
6. Export JSON/CSV
7. Check exported files are valid

## Future Enhancements

- Add more simulated issues (link flapping, DDoS patterns)
- Implement real packet capture functionality
- Add advanced filtering to PCAP analyzer
- Create heatmaps for traffic patterns
- Add timeline view for packet timing analysis
- Implement real-time packet streaming

## Requirements

### Frontend
- Modern browser with ES6 support
- No additional dependencies beyond existing project

### Backend
- Scapy library (for PCAP analysis)
- Docker socket access (for packet capture)
- tcpdump or similar tool (optional, for capture)

### Installation

```bash
# Install Scapy in API container
pip install scapy

# Verify installation
docker exec noc_api python -c "from scapy.all import rdpcap; print('Scapy installed!')"
```

## Troubleshooting

### PCAP Analyzer not working
- Ensure Scapy is installed: `pip install scapy`
- Verify PCAP files exist in /data directory
- Check API logs: `docker logs noc_api`

### Issue Simulator not affecting API responses
- Ensure fetch is being called through browser (not direct HTTP)
- Check browser console for errors
- Verify issue is active in the Active Issues list

### Permissions Issues
- Ensure Docker socket is properly mounted
- Verify container can write to /data directory

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Check API logs: `docker logs noc_api -f`
3. Verify network connectivity to localhost:8001
