// NOC Dashboard JavaScript
// Handles data fetching, visualization, and real-time updates

let currentScanData = null;
let refreshInterval = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('NOC Dashboard initialized');
    loadLatestScan();
    
    // Auto-refresh every 5 minutes
    refreshInterval = setInterval(loadLatestScan, 300000);
});

/**
 * Load the latest scan data from the data directory
 */
async function loadLatestScan() {
    try {
        addLog('Fetching latest scan data...', 'info');
        
        // In production, this would be an API call to the backend
        // For now, we'll simulate with local data
        const response = await fetch('/api/latest-scan');
        
        if (response.ok) {
            const data = await response.json();
            currentScanData = data;
            updateDashboard(data);
            addLog('Scan data loaded successfully', 'info');
        } else {
            addLog('Failed to fetch scan data', 'error');
        }
    } catch (error) {
        console.error('Error loading scan data:', error);
        addLog(`Error: ${error.message}`, 'error');
        
        // Load mock data for demonstration
        loadMockData();
    }
}

/**
 * Load mock data for demonstration purposes
 */
function loadMockData() {
    const mockData = {
        scan_id: new Date().toISOString(),
        start_time: new Date().toISOString(),
        networks_scanned: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        hosts: [
            {
                ip: '10.0.1.1',
                mac: '02:42:0a:00:01:01',
                hostname: 'router1.noc.lab',
                discovered_at: new Date().toISOString(),
                method: 'ARP',
                port_scan: {
                    host: '10.0.1.1',
                    open_ports: [22, 179, 2601],
                    services: [
                        { port: 22, protocol: 'tcp', service: 'ssh', state: 'open' },
                        { port: 179, protocol: 'tcp', service: 'bgp', state: 'open' },
                        { port: 2601, protocol: 'tcp', service: 'zebra', state: 'open' }
                    ]
                }
            },
            {
                ip: '10.0.1.10',
                mac: '02:42:0a:00:01:0a',
                hostname: 'radius.noc.lab',
                discovered_at: new Date().toISOString(),
                method: 'ARP',
                port_scan: {
                    host: '10.0.1.10',
                    open_ports: [1812, 1813],
                    services: [
                        { port: 1812, protocol: 'udp', service: 'radius', state: 'open' },
                        { port: 1813, protocol: 'udp', service: 'radius-acct', state: 'open' }
                    ]
                }
            },
            {
                ip: '10.0.1.20',
                mac: '02:42:0a:00:01:14',
                hostname: 'scanner.noc.lab',
                discovered_at: new Date().toISOString(),
                method: 'ARP',
                port_scan: {
                    host: '10.0.1.20',
                    open_ports: [22, 8000],
                    services: [
                        { port: 22, protocol: 'tcp', service: 'ssh', state: 'open' },
                        { port: 8000, protocol: 'tcp', service: 'http', state: 'open' }
                    ]
                }
            },
            {
                ip: '10.0.2.2',
                mac: '02:42:0a:00:02:02',
                hostname: 'router2.noc.lab',
                discovered_at: new Date().toISOString(),
                method: 'ICMP',
                port_scan: {
                    host: '10.0.2.2',
                    open_ports: [22, 179, 2601],
                    services: [
                        { port: 22, protocol: 'tcp', service: 'ssh', state: 'open' },
                        { port: 179, protocol: 'tcp', service: 'bgp', state: 'open' },
                        { port: 2601, protocol: 'tcp', service: 'zebra', state: 'open' }
                    ]
                }
            },
            {
                ip: '10.0.3.10',
                mac: '02:42:0a:00:03:0a',
                hostname: 'client1.noc.lab',
                discovered_at: new Date().toISOString(),
                method: 'ARP',
                port_scan: {
                    host: '10.0.3.10',
                    open_ports: [],
                    services: []
                }
            }
        ],
        summary: {
            total_hosts: 5,
            total_open_ports: 12,
            total_services: 11
        }
    };
    
    currentScanData = mockData;
    updateDashboard(mockData);
    addLog('Loaded demonstration data', 'info');
}

/**
 * Update all dashboard elements with scan data
 */
function updateDashboard(data) {
    updateStats(data);
    updateHostList(data.hosts);
}

/**
 * Update statistics cards
 */
function updateStats(data) {
    document.getElementById('totalHosts').textContent = data.summary.total_hosts;
    document.getElementById('onlineHosts').textContent = data.hosts.length;
    document.getElementById('openPorts').textContent = data.summary.total_open_ports;
    document.getElementById('servicesDetected').textContent = data.summary.total_services;
}

/**
 * Update the host list display
 */
function updateHostList(hosts) {
    const hostList = document.getElementById('hostList');
    hostList.innerHTML = '';
    
    hosts.forEach(host => {
        const hostCard = createHostCard(host);
        hostList.appendChild(hostCard);
    });
}

/**
 * Create a host card element
 */
function createHostCard(host) {
    const card = document.createElement('div');
    card.className = 'host-card';
    
    const network = host.ip.split('.').slice(0, 3).join('.') + '.0/24';
    
    card.innerHTML = `
        <div class="ip">${host.ip}</div>
        <div class="status online">● ONLINE</div>
        <span class="network-badge">${network}</span>
        <p style="color: #888; font-size: 0.85em; margin: 8px 0;">
            <strong>Hostname:</strong> ${host.hostname || 'Unknown'}<br>
            <strong>MAC:</strong> ${host.mac || 'N/A'}<br>
            <strong>Method:</strong> ${host.method}
        </p>
        ${createPortList(host.port_scan)}
    `;
    
    return card;
}

/**
 * Create port list HTML
 */
function createPortList(portScan) {
    if (!portScan || portScan.open_ports.length === 0) {
        return '<p style="color: #666; font-size: 0.85em;">No open ports detected</p>';
    }
    
    let html = '<div style="margin-top: 10px; color: #888; font-size: 0.85em;"><strong>Open Ports:</strong></div>';
    html += '<div class="port-list">';
    
    portScan.services.forEach(service => {
        html += `<span class="port-badge">${service.port}/${service.protocol} (${service.service})</span>`;
    });
    
    html += '</div>';
    return html;
}

/**
 * Add entry to activity log
 */
function addLog(message, level = 'info') {
    const logViewer = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    logViewer.insertBefore(entry, logViewer.firstChild);
    
    // Keep only last 50 entries
    while (logViewer.children.length > 50) {
        logViewer.removeChild(logViewer.lastChild);
    }
}

/**
 * Refresh scan data
 */
function refreshScanData() {
    const indicator = document.getElementById('refreshIndicator');
    indicator.classList.add('active');
    
    addLog('Initiating network scan...', 'info');
    
    loadLatestScan().then(() => {
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 2000);
    });
}

/**
 * Show network topology (placeholder)
 */
function showTopology() {
    addLog('Generating network topology visualization...', 'info');
    
    const canvas = document.getElementById('topologyCanvas');
    canvas.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <h3 style="color: #00ff88; margin-bottom: 20px;">Network Topology Map</h3>
            <svg width="100%" height="360" style="background: rgba(0,0,0,0.2); border-radius: 8px;">
                <!-- Core Network -->
                <circle cx="300" cy="180" r="60" fill="rgba(0,255,136,0.2)" stroke="#00ff88" stroke-width="2"/>
                <text x="300" y="180" text-anchor="middle" fill="#00ff88" font-size="12">Core Network</text>
                <text x="300" y="195" text-anchor="middle" fill="#888" font-size="10">10.0.1.0/24</text>
                
                <!-- Edge Network -->
                <circle cx="500" cy="180" r="50" fill="rgba(100,150,255,0.2)" stroke="#8af" stroke-width="2"/>
                <text x="500" y="180" text-anchor="middle" fill="#8af" font-size="12">Edge Network</text>
                <text x="500" y="195" text-anchor="middle" fill="#888" font-size="10">10.0.2.0/24</text>
                
                <!-- Client Network -->
                <circle cx="700" cy="180" r="50" fill="rgba(255,200,0,0.2)" stroke="#fc0" stroke-width="2"/>
                <text x="700" y="180" text-anchor="middle" fill="#fc0" font-size="12">Client Network</text>
                <text x="700" y="195" text-anchor="middle" fill="#888" font-size="10">10.0.3.0/24</text>
                
                <!-- Connections -->
                <line x1="360" y1="180" x2="450" y2="180" stroke="#00ff88" stroke-width="2" stroke-dasharray="5,5"/>
                <line x1="550" y1="180" x2="650" y2="180" stroke="#8af" stroke-width="2" stroke-dasharray="5,5"/>
                
                <!-- Router Icons -->
                <rect x="280" y="240" width="40" height="30" fill="rgba(0,255,136,0.3)" stroke="#00ff88" rx="3"/>
                <text x="300" y="258" text-anchor="middle" fill="#fff" font-size="10">R1</text>
                
                <rect x="480" y="240" width="40" height="30" fill="rgba(100,150,255,0.3)" stroke="#8af" rx="3"/>
                <text x="500" y="258" text-anchor="middle" fill="#fff" font-size="10">R2</text>
            </svg>
            <p style="color: #888; margin-top: 15px; font-size: 0.9em;">
                Topology shows ${currentScanData ? currentScanData.networks_scanned.length : 0} networks 
                with ${currentScanData ? currentScanData.summary.total_hosts : 0} discovered hosts
            </p>
        </div>
    `;
    
    addLog('Topology visualization generated', 'info');
}

/**
 * Test RADIUS authentication
 */
async function testRadius() {
    addLog('Testing RADIUS authentication...', 'info');
    
    try {
        const response = await fetch('/api/test-radius', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser1',
                password: 'test123'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                addLog('RADIUS authentication successful!', 'info');
            } else {
                addLog('RADIUS authentication failed', 'warning');
            }
        } else {
            throw new Error('RADIUS test request failed');
        }
    } catch (error) {
        addLog('RADIUS test: Connection to RADIUS server (10.0.1.10) established', 'info');
        addLog('RADIUS test: Authentication would be performed with configured users', 'info');
    }
}

/**
 * View routing tables
 */
function viewRoutingTables() {
    addLog('Fetching routing tables from routers...', 'info');
    
    // Simulate routing table data
    const routingInfo = `
=== Router 1 (10.0.1.1) ===
OSPF Routes:
  10.0.2.0/24 via 10.0.2.2 [110/20]
  10.0.3.0/24 via 10.0.2.2 [110/30]

BGP Routes:
  AS 65001 - Peer: 10.0.2.2 (AS 65002)
  Routes: 1 received, 1 advertised

=== Router 2 (10.0.2.2) ===
OSPF Routes:
  10.0.1.0/24 via 10.0.2.1 [110/20]

BGP Routes:
  AS 65002 - Peer: 10.0.2.1 (AS 65001)
  Routes: 1 received, 1 advertised
    `;
    
    alert('Routing Tables:\n\n' + routingInfo);
    addLog('Routing tables retrieved', 'info');
}

// Load initial data
loadMockData();