// Troubleshooting Dashboard JavaScript
// Provides interactive network diagnostics and troubleshooting tools

// Troubleshooting wizard steps for different problem types
const wizardSteps = {
    'no-connectivity': [
        { layer: 1, step: 'Check if device is powered on and cables connected', command: 'docker-compose ps' },
        { layer: 2, step: 'Verify MAC address in switch table', command: 'Check ARP table' },
        { layer: 3, step: 'Test Layer 3 connectivity with ping', command: 'ping target' },
        { layer: 3, step: 'Check routing table for proper routes', command: 'show ip route' },
        { layer: 4, step: 'Verify ports are open', command: 'telnet/nc port check' }
    ],
    'slow-performance': [
        { layer: 3, step: 'Check for high latency with ping', command: 'ping -c 10 target' },
        { layer: 3, step: 'Trace route to find bottleneck', command: 'traceroute target' },
        { layer: 4, step: 'Check for packet loss and retransmissions', command: 'Packet capture' },
        { layer: 2, step: 'Verify no duplex mismatch or errors', command: 'show interface' },
        { layer: 3, step: 'Check QoS policies for rate limiting', command: 'show policy-map' }
    ],
    'intermittent': [
        { layer: 1, step: 'Check for physical issues (loose cables)', command: 'Check link status' },
        { layer: 2, step: 'Look for MAC flapping in switch logs', command: 'show mac address-table' },
        { layer: 3, step: 'Monitor for route flapping', command: 'show ip route' },
        { layer: 5, step: 'Check session timeouts', command: 'Check NAT/firewall timeouts' },
        { layer: 4, step: 'Monitor for TCP resets', command: 'tcpdump tcp[tcpflags] & tcp-rst != 0' }
    ],
    'service-down': [
        { layer: 1, step: 'Verify service container is running', command: 'docker-compose ps' },
        { layer: 3, step: 'Ping the service IP', command: 'ping service-ip' },
        { layer: 4, step: 'Check if service port is listening', command: 'telnet service-ip port' },
        { layer: 7, step: 'Check application logs for errors', command: 'docker-compose logs service' },
        { layer: 3, step: 'Verify firewall rules allow traffic', command: 'Check firewall rules' }
    ],
    'auth-failure': [
        { layer: 7, step: 'Verify credentials are correct', command: 'Test with known good credentials' },
        { layer: 5, step: 'Check if session expired', command: 'Clear session cache' },
        { layer: 4, step: 'Verify RADIUS server is reachable', command: 'ping radius-server' },
        { layer: 4, step: 'Check RADIUS ports are open', command: 'telnet radius 1812' },
        { layer: 7, step: 'Check RADIUS logs for reject reasons', command: 'tail -f radius.log' }
    ]
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Troubleshooting Dashboard loaded');
    updateHealthStatus();
    checkForIssues();
    drawTopology();
    updateMetrics();
    
    // Auto-refresh every 30 seconds
    setInterval(updateHealthStatus, 30000);
    setInterval(checkForIssues, 30000);
    setInterval(updateMetrics, 30000);
});

// Update layer health status
function updateHealthStatus() {
    // Simulate health checks - in production, this would call backend API
    const layers = [
        { id: 'l1', healthy: true, issue: null },
        { id: 'l2', healthy: true, issue: null },
        { id: 'l3', healthy: true, issue: null },
        { id: 'l4', healthy: true, issue: null },
        { id: 'l5', healthy: true, issue: null },
        { id: 'l6', healthy: true, issue: null },
        { id: 'l7', healthy: true, issue: null }
    ];
    
    layers.forEach(layer => {
        const statusEl = document.getElementById(`${layer.id}-status`);
        if (statusEl) {
            if (layer.healthy) {
                statusEl.textContent = '✅ Healthy';
                statusEl.style.color = '#00ff88';
            } else {
                statusEl.textContent = `⚠️ ${layer.issue}`;
                statusEl.style.color = '#ff0044';
            }
        }
    });
}

// Run ping test
async function runPing() {
    const target = document.getElementById('ping-target').value;
    const output = document.getElementById('ping-output');
    
    if (!target) {
        output.innerHTML = '<span style="color: #ff0044;">Please enter a target IP</span>';
        return;
    }
    
    output.innerHTML = `<span style="color: #ffaa00;">Pinging ${target}...</span>`;
    
    try {
        // In production, this would call backend API
        // For demo, simulate response
        await simulateDelay(2000);
        
        const success = Math.random() > 0.2; // 80% success rate
        
        if (success) {
            output.innerHTML = `
                <span style="color: #00ff88;">✅ Success</span><br>
                Reply from ${target}: bytes=32 time=4ms TTL=64<br>
                Reply from ${target}: bytes=32 time=3ms TTL=64<br>
                Reply from ${target}: bytes=32 time=5ms TTL=64<br>
                <br>
                <strong>Ping statistics:</strong><br>
                Packets: Sent = 3, Received = 3, Lost = 0 (0% loss)<br>
                Average round trip: 4ms
            `;
        } else {
            output.innerHTML = `
                <span style="color: #ff0044;">❌ Failed</span><br>
                Request timed out.<br>
                <br>
                <strong>Troubleshooting:</strong><br>
                1. Verify IP address is correct<br>
                2. Check if device is powered on<br>
                3. Verify network path exists<br>
                4. Check firewall rules
            `;
        }
    } catch (error) {
        output.innerHTML = `<span style="color: #ff0044;">Error: ${error.message}</span>`;
    }
}

// Run traceroute
async function runTraceroute() {
    const target = document.getElementById('trace-target').value;
    const output = document.getElementById('trace-output');
    
    if (!target) {
        output.innerHTML = '<span style="color: #ff0044;">Please enter a target IP</span>';
        return;
    }
    
    output.innerHTML = `<span style="color: #ffaa00;">Tracing route to ${target}...</span>`;
    
    await simulateDelay(3000);
    
    output.innerHTML = `
        <span style="color: #00ff88;">Route trace complete</span><br>
        <table style="width: 100%; font-family: monospace; font-size: 0.85em;">
            <tr><th>Hop</th><th>IP Address</th><th>Hostname</th><th>RTT</th></tr>
            <tr><td>1</td><td>10.0.1.1</td><td>router1.noc.lab</td><td>1ms</td></tr>
            <tr><td>2</td><td>10.0.2.2</td><td>router2.noc.lab</td><td>3ms</td></tr>
            <tr><td>3</td><td>${target}</td><td>destination</td><td>5ms</td></tr>
        </table>
    `;
}

// Check port status
async function checkPort() {
    const host = document.getElementById('port-host').value;
    const port = document.getElementById('port-number').value;
    const output = document.getElementById('port-output');
    
    if (!host || !port) {
        output.innerHTML = '<span style="color: #ff0044;">Please enter both host and port</span>';
        return;
    }
    
    output.innerHTML = `<span style="color: #ffaa00;">Checking ${host}:${port}...</span>`;
    
    await simulateDelay(1500);
    
    const isOpen = Math.random() > 0.3; // 70% chance port is open
    
    if (isOpen) {
        output.innerHTML = `
            <span style="color: #00ff88;">✅ Port ${port} is OPEN on ${host}</span><br>
            Service is listening and accepting connections.<br>
            <br>
            <strong>Common services on this port:</strong><br>
            ${getCommonService(port)}
        `;
    } else {
        output.innerHTML = `
            <span style="color: #ff0044;">❌ Port ${port} is CLOSED or FILTERED on ${host}</span><br>
            <br>
            <strong>Possible causes:</strong><br>
            • Service not running<br>
            • Firewall blocking port<br>
            • Wrong IP address<br>
            • Network ACL blocking traffic
        `;
    }
}

// Run DNS lookup
async function runDNSLookup() {
    const query = document.getElementById('dns-query').value;
    const output = document.getElementById('dns-output');
    
    if (!query) {
        output.innerHTML = '<span style="color: #ff0044;">Please enter a hostname</span>';
        return;
    }
    
    output.innerHTML = `<span style="color: #ffaa00;">Resolving ${query}...</span>`;
    
    await simulateDelay(1000);
    
    // Simulate DNS responses
    const dnsRecords = {
        'router1.noc.lab': '10.0.1.1',
        'router2.noc.lab': '10.0.2.2',
        'radius.noc.lab': '10.0.1.10',
        'scanner.noc.lab': '10.0.1.20',
        'dashboard.noc.lab': '10.0.1.30'
    };
    
    const ip = dnsRecords[query] || 'Not found';
    
    if (ip !== 'Not found') {
        output.innerHTML = `
            <span style="color: #00ff88;">✅ DNS Resolution Successful</span><br>
            <br>
            <strong>Query:</strong> ${query}<br>
            <strong>Type:</strong> A (IPv4)<br>
            <strong>Answer:</strong> ${ip}<br>
            <strong>DNS Server:</strong> 10.0.1.40<br>
            <strong>Query Time:</strong> 23ms
        `;
    } else {
        output.innerHTML = `
            <span style="color: #ff0044;">❌ DNS Resolution Failed</span><br>
            <br>
            <strong>Error:</strong> NXDOMAIN - Name does not exist<br>
            <br>
            <strong>Troubleshooting:</strong><br>
            • Verify hostname is correct<br>
            • Check DNS server is reachable<br>
            • Verify domain exists in DNS zone
        `;
    }
}

// Show ARP table
async function showARPTable() {
    const output = document.getElementById('arp-output');
    output.innerHTML = '<span style="color: #ffaa00;">Retrieving ARP table...</span>';
    
    await simulateDelay(1000);
    
    output.innerHTML = `
        <table style="width: 100%; font-family: monospace; font-size: 0.85em;">
            <tr><th>IP Address</th><th>MAC Address</th><th>Interface</th><th>Type</th></tr>
            <tr><td>10.0.1.1</td><td>02:42:0a:00:01:01</td><td>eth0</td><td>dynamic</td></tr>
            <tr><td>10.0.1.10</td><td>02:42:0a:00:01:0a</td><td>eth0</td><td>dynamic</td></tr>
            <tr><td>10.0.1.20</td><td>02:42:0a:00:01:14</td><td>eth0</td><td>dynamic</td></tr>
            <tr><td>10.0.1.30</td><td>02:42:0a:00:01:1e</td><td>eth0</td><td>dynamic</td></tr>
            <tr><td>10.0.1.40</td><td>02:42:0a:00:01:28</td><td>eth0</td><td>dynamic</td></tr>
        </table>
        <br>
        <span style="color: #00ff88;">5 entries found</span>
    `;
}

// Show routing table
async function showRoutingTable() {
    const router = document.getElementById('router-select').value;
    const output = document.getElementById('route-output');
    
    output.innerHTML = `<span style="color: #ffaa00;">Fetching routing table from ${router}...</span>`;
    
    await simulateDelay(1500);
    
    const routes = {
        router1: `
            <pre style="font-family: monospace; font-size: 0.85em; color: #e0e0e0;">
Codes: C - connected, S - static, O - OSPF, B - BGP

     10.0.0.0/8 is variably subnetted, 3 subnets
C       10.0.1.0/24 is directly connected, eth0
O       10.0.2.0/24 [110/20] via 10.0.2.2, eth1
O       10.0.3.0/24 [110/30] via 10.0.2.2, eth1

Gateway of last resort is not set
            </pre>
            <span style="color: #00ff88;">✅ OSPF routes learned successfully</span>
        `,
        router2: `
            <pre style="font-family: monospace; font-size: 0.85em; color: #e0e0e0;">
Codes: C - connected, S - static, O - OSPF, B - BGP

     10.0.0.0/8 is variably subnetted, 3 subnets
O       10.0.1.0/24 [110/20] via 10.0.2.1, eth0
C       10.0.2.0/24 is directly connected, eth0
C       10.0.3.0/24 is directly connected, eth1

Gateway of last resort is not set
            </pre>
            <span style="color: #00ff88;">✅ OSPF routes learned successfully</span>
        `
    };
    
    output.innerHTML = routes[router];
}

// Update troubleshooting wizard
function updateWizard() {
    const problemType = document.getElementById('problem-type').value;
    const stepsContainer = document.getElementById('wizard-steps');
    
    if (!problemType) {
        stepsContainer.innerHTML = '';
        return;
    }
    
    const steps = wizardSteps[problemType];
    
    let html = '<div class="wizard-step-list">';
    steps.forEach((step, index) => {
        html += `
            <div class="wizard-step">
                <div class="step-header">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-layer">Layer ${step.layer}</span>
                </div>
                <div class="step-content">
                    <strong>${step.step}</strong><br>
                    <code>${step.command}</code>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    stepsContainer.innerHTML = html;
}

// Check for active issues
function checkForIssues() {
    const issuesList = document.getElementById('issues-list');
    
    // Simulate checking for issues
    const issues = [
        // { severity: 'critical', layer: 3, description: 'OSPF neighbor down on Router1', time: '2 minutes ago' },
        // { severity: 'warning', layer: 5, description: 'High session timeout rate detected', time: '15 minutes ago' }
    ];
    
    if (issues.length === 0) {
        issuesList.innerHTML = '<div class="no-issues">✅ No active issues detected</div>';
    } else {
        let html = '';
        issues.forEach(issue => {
            const severityClass = issue.severity === 'critical' ? 'issue-critical' : 'issue-warning';
            html += `
                <div class="issue-card ${severityClass}">
                    <div class="issue-header">
                        <span class="issue-severity">${issue.severity.toUpperCase()}</span>
                        <span class="issue-layer">Layer ${issue.layer}</span>
                        <span class="issue-time">${issue.time}</span>
                    </div>
                    <div class="issue-description">${issue.description}</div>
                </div>
            `;
        });
        issuesList.innerHTML = html;
    }
}

// Draw network topology
function drawTopology() {
    const svg = document.getElementById('topology-svg');
    const width = svg.clientWidth;
    const height = 500;
    
    // Simple topology visualization
    svg.innerHTML = `
        <!-- Core Network -->
        <circle cx="200" cy="250" r="80" fill="rgba(0,255,136,0.1)" stroke="#00ff88" stroke-width="2"/>
        <text x="200" y="240" text-anchor="middle" fill="#00ff88" font-size="14" font-weight="bold">Core Network</text>
        <text x="200" y="260" text-anchor="middle" fill="#888" font-size="12">10.0.1.0/24</text>
        
        <!-- Edge Network -->
        <circle cx="450" cy="250" r="70" fill="rgba(100,150,255,0.1)" stroke="#8af" stroke-width="2"/>
        <text x="450" y="240" text-anchor="middle" fill="#8af" font-size="14" font-weight="bold">Edge Network</text>
        <text x="450" y="260" text-anchor="middle" fill="#888" font-size="12">10.0.2.0/24</text>
        
        <!-- Client Network -->
        <circle cx="700" cy="250" r="70" fill="rgba(255,200,0,0.1)" stroke="#fc0" stroke-width="2"/>
        <text x="700" y="240" text-anchor="middle" fill="#fc0" font-size="14" font-weight="bold">Client Network</text>
        <text x="700" y="260" text-anchor="middle" fill="#888" font-size="12">10.0.3.0/24</text>
        
        <!-- Connections -->
        <line x1="280" y1="250" x2="380" y2="250" stroke="#00ff88" stroke-width="3"/>
        <line x1="520" y1="250" x2="630" y2="250" stroke="#8af" stroke-width="3"/>
        
        <!-- Devices -->
        <!-- RADIUS -->
        <rect x="180" y="150" width="40" height="30" fill="rgba(0,255,136,0.3)" stroke="#00ff88" rx="3"/>
        <text x="200" y="170" text-anchor="middle" fill="#fff" font-size="10">RADIUS</text>
        
        <!-- Scanner -->
        <rect x="180" y="320" width="40" height="30" fill="rgba(0,255,136,0.3)" stroke="#00ff88" rx="3"/>
        <text x="200" y="340" text-anchor="middle" fill="#fff" font-size="10">Scanner</text>
        
        <!-- Routers -->
        <rect x="380" y="235" width="50" height="30" fill="rgba(100,150,255,0.3)" stroke="#8af" rx="3"/>
        <text x="405" y="255" text-anchor="middle" fill="#fff" font-size="10">Router1</text>
        
        <rect x="530" y="235" width="50" height="30" fill="rgba(255,200,0,0.3)" stroke="#fc0" rx="3"/>
        <text x="555" y="255" text-anchor="middle" fill="#fff" font-size="10">Router2</text>
    `;
}

// Update metrics
function updateMetrics() {
    // Simulate metric updates
    document.getElementById('avg-latency').textContent = `${(Math.random() * 5 + 2).toFixed(1)}ms`;
    document.getElementById('packet-loss').textContent = `${(Math.random() * 0.5).toFixed(2)}%`;
    document.getElementById('ospf-neighbors').textContent = '2/2';
    document.getElementById('bgp-sessions').textContent = '1/1';
    document.getElementById('radius-success').textContent = `${(95 + Math.random() * 5).toFixed(1)}%`;
    document.getElementById('dns-time').textContent = `${(Math.random() * 30 + 20).toFixed(0)}ms`;
}

// Start packet capture
function startCapture() {
    const interface = document.getElementById('capture-interface').value;
    const filter = document.getElementById('capture-filter').value;
    const output = document.getElementById('capture-results');
    
    output.innerHTML = `
        <span style="color: #00ff88;">📡 Capturing on ${interface}...</span><br>
        Filter: ${filter || 'none'}<br>
        <br>
        <span style="color: #ffaa00;">Capture running... Click 'Stop' to end capture.</span>
    `;
}

// Stop packet capture
function stopCapture() {
    const output = document.getElementById('capture-results');
    
    output.innerHTML = `
        <span style="color: #00ff88;">✅ Capture stopped</span><br>
        <br>
        <strong>Packets captured:</strong> 157<br>
        <strong>Duration:</strong> 30 seconds<br>
        <strong>File:</strong> capture_20251116_103045.pcap<br>
        <br>
        <a href="#" class="btn" style="display: inline-block; padding: 5px 15px; margin-top: 10px;">
            Download PCAP
        </a>
    `;
}

// Utility function to get common service names
function getCommonService(port) {
    const services = {
        '22': 'SSH (Secure Shell)',
        '80': 'HTTP (Web Server)',
        '443': 'HTTPS (Secure Web)',
        '25': 'SMTP (Email)',
        '53': 'DNS (Domain Name System)',
        '3389': 'RDP (Remote Desktop)',
        '1812': 'RADIUS Authentication',
        '1813': 'RADIUS Accounting',
        '179': 'BGP (Border Gateway Protocol)',
        '2601': 'Zebra (FRRouting)'
    };
    
    return services[port] || 'Unknown service';
}

// Utility: Simulate async delay
function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}