/**
 * NOC Troubleshooting Suite
 * Layer-by-layer network diagnostics
 */

const API_BASE_URL = 'http://localhost:8001/api';

// ============================================================================
// INITIALIZATION
// ============================================================================

function initTroubleshooting() {
    console.log('Troubleshooting suite initialized');
    
    // Load initial data
    checkLayerHealth();
    updateMetrics();
    detectIssues();
    
    // Auto-refresh every 30 seconds
    setInterval(checkLayerHealth, 30000);
    setInterval(updateMetrics, 30000);
}

// ============================================================================
// LAYER HEALTH MONITORING
// ============================================================================

async function checkLayerHealth() {
    // Check each OSI layer's health
    const layers = {
        l7: await checkApplicationLayer(),
        l6: true, // Presentation layer (always healthy in this setup)
        l5: true, // Session layer
        l4: await checkTransportLayer(),
        l3: await checkNetworkLayer(),
        l2: await checkDataLinkLayer(),
        l1: true  // Physical layer (Docker networking)
    };
    
    // Update UI
    Object.entries(layers).forEach(([layer, healthy]) => {
        const statusEl = document.getElementById(`${layer}-status`);
        if (statusEl) {
            if (healthy) {
                statusEl.textContent = '✅ Healthy';
                statusEl.style.color = '#00ff88';
            } else {
                statusEl.textContent = '⚠️ Issue';
                statusEl.style.color = '#ffaa00';
            }
        }
    });
}

async function checkApplicationLayer() {
    try {
        // Test DNS and RADIUS
        const response = await fetch(`${API_BASE_URL}/health/status`);
        return response.ok;
    } catch {
        return false;
    }
}

async function checkTransportLayer() {
    try {
        // Check if key ports are accessible
        const response = await fetch(`${API_BASE_URL}/diagnostics/port-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host: '10.0.1.1', port: 111, protocol: 'tcp' })
        });
        const data = await response.json();
        return data.success;
    } catch {
        return false;
    }
}

async function checkNetworkLayer() {
    try {
        // Ping a router
        const response = await fetch(`${API_BASE_URL}/diagnostics/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: '10.0.1.1', count: 1 })
        });
        const data = await response.json();
        return data.success && data.packet_loss_pct === 0;
    } catch {
        return false;
    }
}

async function checkDataLinkLayer() {
    try {
        // Check ARP table
        const response = await fetch(`${API_BASE_URL}/diagnostics/arp-table`);
        const data = await response.json();
        return data.success && data.entries.length > 0;
    } catch {
        return false;
    }
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

async function updateMetrics() {
    // Update all performance metrics
    await updateLatencyMetric();
    await updateOSPFMetric();
    await updateBGPMetric();
    await updateDNSMetric();
}

async function updateLatencyMetric() {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: '10.0.1.1', count: 3 })
        });
        const data = await response.json();
        
        if (data.success) {
            const latencyEl = document.getElementById('avg-latency');
            const lossEl = document.getElementById('packet-loss');
            if (latencyEl) latencyEl.textContent = `${data.avg_rtt}ms`;
            if (lossEl) lossEl.textContent = `${data.packet_loss_pct}%`;
        }
    } catch (error) {
        console.error('Failed to update latency:', error);
    }
}

async function updateOSPFMetric() {
    try {
        const response = await fetch(`${API_BASE_URL}/network/ospf/neighbors?router=router1`);
        const data = await response.json();
        
        if (data.success) {
            const ospfEl = document.getElementById('ospf-neighbors');
            if (ospfEl) {
                const total = data.neighbors.length;
                const up = data.neighbors.filter(n => n.state.includes('Full')).length;
                ospfEl.textContent = `${up}/${total}`;
            }
        }
    } catch (error) {
        console.error('Failed to update OSPF:', error);
    }
}

async function updateBGPMetric() {
    try {
        const response = await fetch(`${API_BASE_URL}/network/bgp/summary?router=router1`);
        const data = await response.json();
        
        if (data.success) {
            const bgpEl = document.getElementById('bgp-sessions');
            if (bgpEl) {
                const total = data.peers.length;
                const established = data.peers.filter(p => p.state === 'Established').length;
                bgpEl.textContent = `${established}/${total}`;
            }
        }
    } catch (error) {
        console.error('Failed to update BGP:', error);
    }
}

async function updateDNSMetric() {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnostics/dns-lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostname: 'router1.noc.lab' })
        });
        const data = await response.json();
        
        if (data.success) {
            const dnsEl = document.getElementById('dns-time');
            if (dnsEl) dnsEl.textContent = `${data.query_time}ms`;
        }
    } catch (error) {
        console.error('Failed to update DNS:', error);
    }
}

// ============================================================================
// DIAGNOSTIC TOOLS (FOR HTML ONCLICK HANDLERS)
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
            
            // Update latency metric
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
    
    try {
        const response = await fetch(`${API_BASE_URL}/network/routing-table/${router}`);
        const data = await response.json();
        
        if (data.success && data.routes) {
            let html = `<div style="color: #00ff88;">✓ Routes for ${router}</div><div style="margin-top: 10px;">`;
            data.routes.forEach(route => {
                html += `<div>${route.network} via ${route.gateway} [${route.protocol}]</div>`;
            });
            html += '</div>';
            output.innerHTML = html;
        } else {
            output.innerHTML = `<div style="color: #ff0044;">✗ Failed to load routing table</div>`;
        }
    } catch (error) {
        output.innerHTML = `<div style="color: #ff0044;">Error: ${error.message}</div>`;
    }
}

async function updateWizard() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;
    
    const issues = [];
    
    // Check for high latency
    try {
        const pingResponse = await fetch(`${API_BASE_URL}/diagnostics/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: '10.0.1.1', count: 3 })
        });
        const pingData = await pingResponse.json();
        
        if (pingData.success) {
            if (pingData.avg_rtt > 50) {
                issues.push({
                    severity: 'warning',
                    layer: 'L3',
                    description: `High latency detected: ${pingData.avg_rtt}ms average`,
                    time: new Date().toLocaleTimeString()
                });
            }
            if (pingData.packet_loss_pct > 0) {
                issues.push({
                    severity: 'critical',
                    layer: 'L3',
                    description: `Packet loss detected: ${pingData.packet_loss_pct}%`,
                    time: new Date().toLocaleTimeString()
                });
            }
        }
    } catch (error) {
        issues.push({
            severity: 'critical',
            layer: 'L3',
            description: 'Unable to reach network devices',
            time: new Date().toLocaleTimeString()
        });
    }
    
    // Display issues
    if (issues.length === 0) {
        issuesList.innerHTML = '<div class="no-issues">✅ No issues detected - All systems operational</div>';
    } else {
        let html = '';
        issues.forEach(issue => {
            html += `
                <div class="issue-card issue-${issue.severity}">
                    <div class="issue-header">
                        <div>
                            <span class="issue-severity">${issue.severity.toUpperCase()}</span>
                            <span class="issue-layer">${issue.layer}</span>
                        </div>
                        <span class="issue-time">${issue.time}</span>
                    </div>
                    <div class="issue-description">${issue.description}</div>
                </div>
            `;
        });
        issuesList.innerHTML = html;
    }
}

// ============================================================================
// PACKET CAPTURE (PLACEHOLDER)
// ============================================================================

let captureRunning = false;

function startCapture() {
    const interface = document.getElementById('capture-interface')?.value;
    const filter = document.getElementById('capture-filter')?.value;
    const output = document.getElementById('capture-results');
    
    if (!output) return;
    
    captureRunning = true;
    output.innerHTML = `
        <div style="color: #00ff88;">📡 Capture started on ${interface}</div>
        <div style="color: #888; margin-top: 10px;">Filter: ${filter || 'none'}</div>
        <div style="color: #666; margin-top: 10px;">
            Note: Packet capture functionality requires additional setup.<br>
            In production, this would use tcpdump/wireshark integration.
        </div>
    `;
}

function stopCapture() {
    const output = document.getElementById('capture-results');
    if (!output) return;
    
    captureRunning = false;
    output.innerHTML += `<div style="color: #ffaa00; margin-top: 10px;">⏹️ Capture stopped</div>`;
}

// ============================================================================
// NETWORK TOPOLOGY VISUALIZATION
// ============================================================================

function drawTopology() {
    const svg = document.getElementById('topology-svg');
    if (!svg) return;
    
    // Simple SVG network diagram
    svg.innerHTML = `
        <!-- Background -->
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.2)"/>
        
        <!-- Core Network -->
        <text x="50%" y="50" text-anchor="middle" fill="#00ff88" font-size="14">Core Network (10.0.1.0/24)</text>
        
        <!-- Router 1 -->
        <circle cx="200" cy="150" r="30" fill="rgba(0,255,136,0.2)" stroke="#00ff88" stroke-width="2"/>
        <text x="200" y="155" text-anchor="middle" fill="#fff" font-size="12">Router1</text>
        <text x="200" y="200" text-anchor="middle" fill="#888" font-size="10">10.0.1.1</text>
        
        <!-- Router 2 -->
        <circle cx="400" cy="150" r="30" fill="rgba(0,255,136,0.2)" stroke="#00ff88" stroke-width="2"/>
        <text x="400" y="155" text-anchor="middle" fill="#fff" font-size="12">Router2</text>
        <text x="400" y="200" text-anchor="middle" fill="#888" font-size="10">10.0.1.2</text>
        
        <!-- RADIUS -->
        <circle cx="100" cy="300" r="25" fill="rgba(100,150,255,0.2)" stroke="#8af" stroke-width="2"/>
        <text x="100" y="305" text-anchor="middle" fill="#fff" font-size="11">RADIUS</text>
        <text x="100" y="340" text-anchor="middle" fill="#888" font-size="9">10.0.1.10</text>
        
        <!-- DNS -->
        <circle cx="250" cy="300" r="25" fill="rgba(100,150,255,0.2)" stroke="#8af" stroke-width="2"/>
        <text x="250" y="305" text-anchor="middle" fill="#fff" font-size="11">DNS</text>
        <text x="250" y="340" text-anchor="middle" fill="#888" font-size="9">10.0.1.11</text>
        
        <!-- Scanner -->
        <circle cx="400" cy="300" r="25" fill="rgba(255,170,0,0.2)" stroke="#fa0" stroke-width="2"/>
        <text x="400" y="305" text-anchor="middle" fill="#fff" font-size="11">Scanner</text>
        <text x="400" y="340" text-anchor="middle" fill="#888" font-size="9">10.0.1.12</text>
        
        <!-- Clients -->
        <circle cx="550" cy="300" r="20" fill="rgba(255,255,255,0.1)" stroke="#ccc" stroke-width="2"/>
        <text x="550" y="305" text-anchor="middle" fill="#fff" font-size="10">Client1</text>
        
        <circle cx="650" cy="300" r="20" fill="rgba(255,255,255,0.1)" stroke="#ccc" stroke-width="2"/>
        <text x="650" y="305" text-anchor="middle" fill="#fff" font-size="10">Client2</text>
        
        <!-- Connections -->
        <line x1="200" y1="180" x2="100" y2="275" stroke="rgba(0,255,136,0.3)" stroke-width="2"/>
        <line x1="200" y1="180" x2="250" y2="275" stroke="rgba(0,255,136,0.3)" stroke-width="2"/>
        <line x1="200" y1="150" x2="370" y2="150" stroke="#00ff88" stroke-width="3" stroke-dasharray="5,5"/>
        <text x="285" y="140" text-anchor="middle" fill="#00ff88" font-size="10">OSPF</text>
        <line x1="400" y1="180" x2="400" y2="275" stroke="rgba(0,255,136,0.3)" stroke-width="2"/>
        <line x1="430" y1="150" x2="550" y2="280" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <line x1="430" y1="150" x2="650" y2="280" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    `;
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTroubleshooting();
        drawTopology();
    });
} else {
    initTroubleshooting();
    drawTopology();
}