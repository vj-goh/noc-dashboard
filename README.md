# NOC Dashboard - Network Operations Center

A comprehensive network monitoring and analysis platform demonstrating:
- Docker container orchestration
- Network protocols (OSPF, BGP, RADIUS)
- Network scanning and service detection
- Real-time web dashboard visualization
- Multi-network topology management

## 🏗️ Architecture

### Network Topology
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Core Network   │────────│  Edge Network   │────────│ Client Network  │
│   10.0.1.0/24   │         │   10.0.2.0/24   │         │   10.0.3.0/24   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                            │                            │
  ┌────┴────┐                  ┌───┴───┐                   ┌────┴────┐
  │ Router1 │──────OSPF────────│Router2│                   │ Client1 │
  │  (BGP)  │      BGP         │       │                   │ Client2 │
  └─────────┘                  └───────┘                   └─────────┘
       │
  ┌────┴──────────┬────────────┬────────────┐
  │               │            │            │
┌─────┐      ┌────────┐   ┌─────────┐  ┌─────┐
│RADIUS│      │Scanner │   │Dashboard│  │ DNS │
└─────┘      └────────┘   └─────────┘  └─────┘
```

### Components

1. **FRRouting Routers** (router1, router2)
   - OSPF routing protocol
   - BGP peering between autonomous systems
   - Enterprise-grade routing simulation

2. **FreeRADIUS Server**
   - AAA (Authentication, Authorization, Accounting)
   - Multiple test users configured
   - Network access control

3. **Network Scanner**
   - Host discovery (ARP + ICMP)
   - Port scanning (nmap)
   - Service detection
   - RADIUS authentication testing
   - Packet capture capabilities

4. **Web Dashboard**
   - Real-time network visualization
   - Host and service monitoring
   - Activity logging
   - Topology mapping

5. **DNS/DHCP Server** (dnsmasq)
   - Local DNS resolution
   - Network service discovery

6. **Client Machines** (client1, client2)
   - Simulated workstations
   - Traffic generation targets

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB of available RAM
- Ports available: 5174, 3000, 1812, 1813, 53

### Installation

1. **Clone or navigate to the project directory:**
```bash
cd noc-dashboard
```

2. **Start all containers:**
```bash
docker-compose up -d
```

3. **Verify all containers are running:**
```bash
docker-compose ps
```

Expected output:
```
NAME              STATUS    PORTS
noc_router1       running
noc_router2       running
noc_radius        running   0.0.0.0:1812-1813->1812-1813/udp
noc_scanner       running
noc_dashboard     running   0.0.0.0:5174->5174/tcp
noc_dns           running   0.0.0.0:53->53/udp
noc_client1       running
noc_client2       running
```

4. **Access the dashboard:**
Open your browser to: `http://localhost:5173`

## 📊 Using the Dashboard

### Available Features

1. **Network Scanning**
   - Click "🔄 Refresh Scan" to perform a new network scan
   - Discovers hosts across all three networks
   - Identifies open ports and running services

2. **Network Topology**
   - Click "🗺️ Network Topology" to view network map
   - Shows relationship between networks
   - Displays routing connections

3. **RADIUS Testing**
   - Click "🔐 Test RADIUS" to authenticate
   - Tests connection to RADIUS server
   - Validates AAA functionality

4. **Routing Tables**
   - Click "📋 Routing Tables" to view routes
   - Shows OSPF and BGP routing information
   - Demonstrates dynamic routing protocols

## 🔧 Technical Deep Dive

### Understanding OSPF (Open Shortest Path First)

OSPF is a link-state routing protocol used in this lab to automatically share routes between Router1 and Router2.

**Key Concepts:**
- **Area 0 (Backbone)**: All routers are in the backbone area
- **Router ID**: Unique identifier (1.1.1.1 and 2.2.2.2)
- **Link-State Advertisements (LSAs)**: Routers exchange topology information
- **SPF Algorithm**: Calculates shortest path to all destinations

**To view OSPF status:**
```bash
# Connect to router1
docker exec -it noc_router1 vtysh

# Inside vtysh
show ip ospf neighbor
show ip ospf route
show ip ospf interface
```

### Understanding BGP (Border Gateway Protocol)

BGP is used for routing between different autonomous systems (AS). In this lab:
- Router1 is in AS 65001
- Router2 is in AS 65002
- They peer over the 10.0.2.0/24 network

**Key Concepts:**
- **AS Number**: Identifies autonomous system
- **Peering**: Routers establish BGP session
- **Path Attributes**: Used for route selection
- **eBGP vs iBGP**: External vs Internal BGP

**To view BGP status:**
```bash
docker exec -it noc_router1 vtysh

# Inside vtysh
show ip bgp summary
show ip bgp neighbors
show ip bgp
```

### Understanding RADIUS

RADIUS provides centralized Authentication, Authorization, and Accounting (AAA).

**Authentication Flow:**
1. Client sends credentials to NAS (Network Access Server)
2. NAS forwards to RADIUS server
3. RADIUS validates against user database
4. RADIUS sends Accept or Reject
5. NAS grants or denies access

**Test Users:**
- Username: `admin` / Password: `admin123` (Admin)
- Username: `vjnetwork` / Password: `vj_secure_pass` (Engineer)
- Username: `testuser1` / Password: `test123` (Test)
- Username: `guest` / Password: `guest123` (Guest)

**To test RADIUS manually:**
```bash
docker exec -it noc_scanner radtest testuser1 test123 10.0.1.10 1812 network_secret_key
```

### Understanding Docker Networking

This lab uses Docker bridge networks to simulate real network segments:

**Network Types:**
- **Bridge Networks**: Layer 2 segments with automatic routing
- **Static IPs**: Each container has predictable address
- **Inter-network Routing**: Handled by router containers

**Key Docker Networking Commands:**
```bash
# List networks
docker network ls

# Inspect a network
docker network inspect noc-dashboard_core_network

# View container IPs
docker-compose ps -q | xargs docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

## 🛠️ Advanced Operations

### Network Traffic Analysis

**Capture packets on scanner:**
```bash
docker exec -it noc_scanner tcpdump -i eth0 -w /data/capture.pcap
```

**Generate test traffic between clients:**
```bash
# Start iperf3 server on client1
docker exec -it noc_client1 iperf3 -s

# Run client test from client2
docker exec -it noc_client2 iperf3 -c 10.0.3.10 -t 30
```

### Router Configuration

**Access router CLI:**
```bash
docker exec -it noc_router1 vtysh
```

**Common vtysh commands:**
```
# Show running config
show running-config

# Show IP routes
show ip route

# Show interfaces
show interface brief

# Show OSPF neighbors
show ip ospf neighbor

# Show BGP summary
show ip bgp summary

# Configure mode
configure terminal
```

### Scanner Operations

**Run manual scan:**
```bash
docker exec -it noc_scanner python /app/scanner.py
```

**View scan logs:**
```bash
docker logs noc_scanner
```

**Access scan data:**
```bash
docker exec -it noc_scanner ls -la /data/
```

### RADIUS Server Management

**View RADIUS logs:**
```bash
docker exec -it noc_radius tail -f /var/log/freeradius/radius.log
```

**Test authentication:**
```bash
docker exec -it noc_radius radtest admin admin123 localhost 1812 testing123
```

**Edit users:**
```bash
# Users file is mounted from ./config/radius/users
# Edit locally and restart container:
docker-compose restart radius
```

## 🐛 Troubleshooting

### Containers Won't Start
```bash
# Check logs
docker-compose logs

# Check specific container
docker-compose logs router1

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Network Connectivity Issues
```bash
# Verify networks exist
docker network ls | grep noc

# Check container IPs
docker network inspect noc-dashboard_core_network

# Test connectivity from scanner
docker exec -it noc_scanner ping 10.0.1.1
```

### Dashboard Not Loading
```bash
# Check if dashboard container is running
docker-compose ps dashboard

# View dashboard logs
docker-compose logs dashboard

# Restart dashboard
docker-compose restart dashboard
```

### RADIUS Authentication Failing
```bash
# Check RADIUS logs
docker-compose logs radius

# Test locally
docker exec -it noc_radius radtest testuser1 test123 localhost 1812 testing123

# Verify client configuration
docker exec -it noc_radius cat /etc/raddb/clients.conf
```

## 🎯 Next Steps & Enhancements

### Potential Improvements

1. **Advanced Monitoring**
   - SNMP integration
   - NetFlow collection
   - Prometheus/Grafana metrics

2. **Security Features**
   - IDS/IPS integration (Suricata/Snort)
   - Vulnerability scanning
   - Security event correlation

3. **Automation**
   - Ansible playbooks for configuration
   - CI/CD pipeline for updates
   - Automated compliance checking

4. **Scalability**
   - Kubernetes deployment
   - Microservices architecture
   - Message queue integration

## 📖 Learning Resources

### Networking
- [FRRouting Documentation](https://docs.frrouting.org/)
- [OSPF RFC 2328](https://www.rfc-editor.org/rfc/rfc2328)
- [BGP RFC 4271](https://www.rfc-editor.org/rfc/rfc4271)

### RADIUS
- [FreeRADIUS Documentation](https://freeradius.org/documentation/)
- [RADIUS RFC 2865](https://www.rfc-editor.org/rfc/rfc2865)

### Docker
- [Docker Documentation](https://docs.docker.com/)
- [Docker Networking](https://docs.docker.com/network/)

### Python Networking
- [Scapy Documentation](https://scapy.readthedocs.io/)
- [Python Nmap](https://pypi.org/project/python-nmap/)

## 📄 License

This project is for educational and demonstration purposes.

## 👤 Author

VJ Goh - 5th Year Computing & Information Tech. Major @ RIT || Aspiring Network Engineer & Web Developer
Created for technical exploration and growth
---

**Built with:** Docker, Python, FRRouting, FreeRADIUS, Node.js, and lots of ☕
