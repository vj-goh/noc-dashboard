/**
 * NOC Dashboard API Integration
 * Connects to FastAPI backend with all endpoints
 */

const API_BASE_URL = 'http://localhost:8001/api';
let isScanning = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

function initDashboard() {
    addLog('Dashboard initialized', 'info');
    addLog('Connecting to API...', 'info');
    
    // Initial data load
    loadAllData();
    
    // Auto-refresh every 30 seconds
    setInterval(checkAPIHealth, 30000);
    setInterval(() => {
        if (!isScanning) {
            loadScanData();
        }
    }, 60000);
}

// ============================================================================
// API HEALTH CHECK
// ============================================================================

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health/status`);
        if (!response.ok) throw new Error('API not responding');
        
        const data = await response.json();
        addLog('API connection healthy', 'info');
        return true;
    } catch (error) {
        addLog(`API connection failed: ${error.message}`, 'error');
        return false;
    }
}

// ============================================================================
// SCAN DATA
// ============================================================================

async function loadScanData() {
    try {
        const response = await fetch(`${API_BASE_URL}/scan/latest`);
        const data = await response.json();
        
        if (data.success && data.hosts.length > 0) {
            displayScanResults(data);
            updateStats(data);
            addLog(`Scan loaded: ${data.hosts.length} hosts discovered`, 'info');
        } else {
            addLog('No scan data available yet', 'warning');
        }
    } catch (error) {
        addLog(`Failed to load scan data: ${error.message}`, 'error');
    }
}

async function refreshScanData() {
    isScanning = true;
    showRefreshIndicator();
    addLog('Triggering new network scan...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/scan/start`, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            addLog('Scan triggered successfully', 'info');
            // Wait a bit then reload
            setTimeout(async () => {
                await loadScanData();
                hideRefreshIndicator();
                isScanning = false;
            }, 5000);
        }
    } catch (error) {
        addLog(`Scan trigger failed: ${error.message}`, 'error');
        hideRefreshIndicator();
        isScanning = false;
    }
}

function displayScanResults(data) {
    const hostList = document.getElementById('hostList');
    if (!hostList) return;
    
    let html = '';
    
    data.hosts.forEach(host => {
        const status = host.open_ports.length > 0 ? 'online' : 'offline';
        const statusText = host.open_ports.length > 0 ? 'Online' : 'Discovered';
        
        html += `
            <div class="host-card">
                <div class="ip">${host.ip}</div>
                <span class="status ${status}">${statusText}</span>
                ${host.hostname ? `<div style="color: #888; font-size: 0.9em; margin: 5px 0;">${host.hostname}</div>` : ''}
                ${host.mac ? `<div style="color: #666; font-size: 0.8em; font-family: monospace;">${host.mac}</div>` : ''}
                ${host.vendor ? `<div style="color: #888; font-size: 0.85em; margin-top: 5px;">${host.vendor}</div>` : ''}
                ${host.open_ports.length > 0 ? `
                    <div class="port-list">
                        ${host.open_ports.map(port => `<span class="port-badge">${port}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    hostList.innerHTML = html || '<p style="color: #666;">No hosts discovered</p>';
}

function updateStats(data) {
    const totalHosts = document.getElementById('totalHosts');
    const onlineHosts = document.getElementById('onlineHosts');
    const openPorts = document.getElementById('openPorts');
    const servicesDetected = document.getElementById('servicesDetected');
    
    if (totalHosts) totalHosts.textContent = data.hosts.length;
    if (onlineHosts) onlineHosts.textContent = data.hosts.filter(h => h.open_ports.length > 0).length;
    if (openPorts) openPorts.textContent = data.summary.total_ports || 0;
    if (servicesDetected) servicesDetected.textContent = data.summary.total_ports || 0;
}

// ============================================================================
// NETWORK INFORMATION
// ============================================================================

async function loadRoutingTable(router = 'router1') {
    try {
        addLog(`Loading routing table from ${router}...`, 'info');
        const response = await fetch(`${API_BASE_URL}/network/routing-table/${router}`);
        const data = await response.json();
        
        if (data.success) {
            addLog(`Loaded ${data.routes.length} routes from ${router}`, 'info');
            return data;
        }
    } catch (error) {
        addLog(`Failed to load routing table: ${error.message}`, 'error');
        return null;
    }
}

async function loadOSPFNeighbors(router = 'router1') {
    try {
        const response = await fetch(`${API_BASE_URL}/network/ospf/neighbors?router=${router}`);
        const data = await response.json();
        
        if (data.success) {
            // Update OSPF metric in troubleshooting page
            const ospfEl = document.getElementById('ospf-neighbors');
            if (ospfEl) {
                ospfEl.textContent = `${data.neighbors.length}/${data.neighbors.length}`;
            }
            return data;
        }
    } catch (error) {
        addLog(`Failed to load OSPF neighbors: ${error.message}`, 'error');
        return null;
    }
}

async function loadBGPSummary(router = 'router1') {
    try {
        const response = await fetch(`${API_BASE_URL}/network/bgp/summary?router=${router}`);
        const data = await response.json();
        
        if (data.success) {
            // Update BGP metric in troubleshooting page
            const bgpEl = document.getElementById('bgp-sessions');
            if (bgpEl) {
                const established = data.peers.filter(p => p.state === 'Established').length;
                bgpEl.textContent = `${established}/${data.peers.length}`;
            }
            return data;
        }
    } catch (error) {
        addLog(`Failed to load BGP summary: ${error.message}`, 'error');
        return null;
    }
}

async function viewRoutingTables() {
    const router = 'router1';
    const data = await loadRoutingTable(router);
    
    if (data && data.routes.length > 0) {
        let routeInfo = `Routing Table for ${router}:\n\n`;
        data.routes.forEach(route => {
            routeInfo += `${route.network} via ${route.gateway} [${route.protocol}]\n`;
        });
        alert(routeInfo);
    }
}

// ============================================================================
// DIAGNOSTICS - For Troubleshooting Suite
// ============================================================================

async function runPing() {
    const target = document.getElementById('ping-target')?.value;
    const output = document.getElementById('ping-output');
    if (!target || !output) return;
    
    output.innerHTML = '<div style="color: #888;">Running ping...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, count: 3 })
        });
        const data = await response.json();
        
        if (data.success) {
            output.innerHTML = `
                <div style="color: #00ff88;">✓ Ping successful</div>
                <div>Target: ${data.target}</div>
                <div>Packets: ${data.packets_sent} sent, ${data.packets_received} received</div>
                <div>Loss: ${data.packet_loss_pct}%</div>
                <div>RTT: min ${data.min_rtt}ms / avg ${data.avg_rtt}ms / max ${data.max_rtt}ms</div>
            `;
            
            // Update latency metric if on troubleshooting page
            const latencyEl = document.getElementById('avg-latency');
            const lossEl = document.getElementById('packet-loss');
            if (latencyEl) latencyEl.textContent = `${data.avg_rtt}ms`;
            if (lossEl) lossEl.textContent = `${data.packet_loss_pct}%`;
        } else {
            output.innerHTML = `<div style="color: #ff0044;">✗ Ping failed: ${data.message}</div>`;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function runTraceroute() {
    const target = document.getElementById('trace-target')?.value;
    const output = document.getElementById('trace-output');
    if (!target || !output) return;
    
    output.innerHTML = '<div style="color: #888;">Running traceroute...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/traceroute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, max_hops: 15 })
        });
        const data = await response.json();
        
        if (data.success) {
            let html = `<div style="color: #00ff88;">✓ Traceroute to ${data.target}</div><div style="margin-top: 10px;">`;
            data.hops.forEach(hop => {
                html += `<div>${hop.hop_number}. ${hop.ip_address || '*'} ${hop.rtt ? hop.rtt + 'ms' : ''}</div>`;
            });
            html += '</div>';
            output.innerHTML = html;
        } else {
            output.innerHTML = `<div style="color: #ff0044;">✗ Traceroute failed</div>`;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function checkPort() {
    const host = document.getElementById('port-host')?.value;
    const port = document.getElementById('port-number')?.value;
    const output = document.getElementById('port-output');
    if (!host || !port || !output) return;
    
    output.innerHTML = '<div style="color: #888;">Checking port...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/port-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port: parseInt(port), protocol: 'tcp' })
        });
        const data = await response.json();
        
        if (data.success) {
            const status = data.open ? '✓ OPEN' : '✗ CLOSED';
            const color = data.open ? '#00ff88' : '#ff0044';
            output.innerHTML = `
                <div style="color: ${color};">${status}</div>
                <div>Host: ${data.host}</div>
                <div>Port: ${data.port}/${data.protocol}</div>
                ${data.service ? `<div>Service: ${data.service}</div>` : ''}
            `;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function runDNSLookup() {
    const hostname = document.getElementById('dns-query')?.value;
    const output = document.getElementById('dns-output');
    if (!hostname || !output) return;
    
    output.innerHTML = '<div style="color: #888;">Resolving...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/dns-lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostname })
        });
        const data = await response.json();
        
        if (data.success && data.resolved) {
            output.innerHTML = `
                <div style="color: #00ff88;">✓ Resolved</div>
                <div>Hostname: ${data.hostname}</div>
                <div>IP: ${data.ip_address}</div>
                <div>Query time: ${data.query_time}ms</div>
            `;
            
            // Update DNS metric
            const dnsEl = document.getElementById('dns-time');
            if (dnsEl) dnsEl.textContent = `${data.query_time}ms`;
        } else {
            output.innerHTML = `<div style="color: #ff0044;">✗ Failed to resolve</div>`;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function showARPTable() {
    const output = document.getElementById('arp-output');
    if (!output) return;
    
    output.innerHTML = '<div style="color: #888;">Loading ARP table...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/arp-table`);
        const data = await response.json();
        
        if (data.success) {
            let html = '<div style="color: #00ff88;">✓ ARP Table</div><div style="margin-top: 10px;">';
            data.entries.forEach(entry => {
                html += `<div>${entry.ip} → ${entry.mac} (${entry.interface})</div>`;
            });
            html += '</div>';
            output.innerHTML = html;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function showRoutingTable() {
    const router = document.getElementById('router-select')?.value || 'router1';
    const output = document.getElementById('route-output');
    if (!output) return;
    
    output.innerHTML = '<div style="color: #888;">Loading routing table...</div>';
    
    const data = await loadRoutingTable(router);
    if (data && data.routes) {
        let html = `<div style="color: #00ff88;">✓ Routes for ${router}</div><div style="margin-top: 10px;">`;
        data.routes.forEach(route => {
            html += `<div>${route.network} via ${route.next_hop} [${route.protocol}]</div>`;
        });
        html += '</div>';
        output.innerHTML = html;
    }
}

// ============================================================================
// RADIUS TESTING
// ============================================================================

async function testRadius() {
    const username = prompt('Enter username:', 'testuser1');
    const password = prompt('Enter password:', 'test123');
    
    if (!username || !password) return;
    
    addLog(`Testing RADIUS authentication for ${username}...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/radius/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            if (data.authenticated) {
                addLog(`✓ Authentication successful for ${username}`, 'info');
                alert(`✓ Authentication successful!\nUser: ${username}\nServer: ${data.server}\nResponse time: ${data.response_time}ms`);
                
                // Update RADIUS metric
                const radiusEl = document.getElementById('radius-success');
                if (radiusEl) radiusEl.textContent = '100%';
            } else {
                addLog(`✗ Authentication failed for ${username}`, 'error');
                alert(`✗ Authentication failed\n${data.message}`);
            }
        }
    } catch (error) {
        addLog(`RADIUS test error: ${error.message}`, 'error');
        alert(`Error testing RADIUS: ${error.message}`);
    }
}

// ============================================================================
// TOPOLOGY VISUALIZATION
// ============================================================================

function showTopology() {
    addLog('Loading network topology...', 'info');
    // This would draw the network topology
    // For now, just show a message
    alert('Network topology visualization coming soon!\n\nThe network includes:\n- 2 Routers (OSPF/BGP)\n- 1 RADIUS Server\n- 1 DNS Server\n- 1 Scanner\n- 2 Client machines');
}

// ============================================================================
// TROUBLESHOOTING WIZARD
// ============================================================================

function updateWizard() {
    const problemType = document.getElementById('problem-type')?.value;
    const stepsContainer = document.getElementById('wizard-steps');
    
    if (!problemType || !stepsContainer) return;
    
    const wizards = {
        'no-connectivity': [
            { layer: 'L1', step: 'Check physical cable connections', command: 'docker exec -it noc_scanner ip link' },
            { layer: 'L2', step: 'Verify ARP table', command: 'View ARP Table above' },
            { layer: 'L3', step: 'Test basic ping connectivity', command: 'Ping target host' },
            { layer: 'L3', step: 'Check routing table', command: 'View routing table above' },
            { layer: 'L4', step: 'Verify port is open', command: 'Use port scanner above' }
        ],
        'slow-performance': [
            { layer: 'L3', step: 'Check ping latency and packet loss', command: 'Run ping test' },
            { layer: 'L3', step: 'Trace route to identify slow hop', command: 'Run traceroute' },
            { layer: 'L4', step: 'Check for port congestion', command: 'Monitor open connections' },
            { layer: 'L7', step: 'Test DNS resolution time', command: 'Use DNS lookup tool' }
        ],
        'service-down': [
            { layer: 'L3', step: 'Verify host is reachable', command: 'Ping the service host' },
            { layer: 'L4', step: 'Check if service port is open', command: 'Scan service port' },
            { layer: 'L7', step: 'Test service endpoint', command: 'curl http://host:port' }
        ],
        'auth-failure': [
            { layer: 'L3', step: 'Verify RADIUS server is reachable', command: 'Ping 10.0.1.10' },
            { layer: 'L4', step: 'Check RADIUS port 1812', command: 'Scan port 1812/udp' },
            { layer: 'L7', step: 'Test RADIUS authentication', command: 'Use RADIUS test button above' }
        ]
    };
    
    const steps = wizards[problemType] || [];
    
    let html = '<div class="wizard-step-list">';
    steps.forEach((step, idx) => {
        html += `
            <div class="wizard-step">
                <div class="step-header">
                    <span class="step-number">${idx + 1}</span>
                    <span class="step-layer">${step.layer}</span>
                    <strong>${step.step}</strong>
                </div>
                <div class="step-content">
                    <code>${step.command}</code>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    stepsContainer.innerHTML = html;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function addLog(message, type = 'info') {
    const log = document.getElementById('activityLog');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${type.toUpperCase()}] ${timestamp} - ${message}`;
    
    log.insertBefore(entry, log.firstChild);
    
    // Keep only last 50 entries
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

function showRefreshIndicator() {
    const indicator = document.getElementById('refreshIndicator');
    if (indicator) indicator.classList.add('active');
}

function hideRefreshIndicator() {
    const indicator = document.getElementById('refreshIndicator');
    if (indicator) indicator.classList.remove('active');
}

// ============================================================================
// LOAD ALL DATA
// ============================================================================

async function loadAllData() {
    await loadScanData();
    await loadOSPFNeighbors('router1');
    await loadBGPSummary('router1');
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}