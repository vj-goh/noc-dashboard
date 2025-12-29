// Virtual Device Management JavaScript
// Handles network, DHCP, device, and traffic configuration

const API_BASE = '/api/devices';
let networks = [];
let dhcpServers = [];
let devices = [];
let trafficPatterns = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Virtual Device Configuration initialized');
    loadAllData();
    setInterval(loadAllData, 5000); // Refresh every 5 seconds
});

// ===== Logging Functions =====

function addLog(message, type = 'info') {
    const logElement = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.style.color = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#0066cc';
    logEntry.textContent = `[${timestamp}] ${message}`;
    logElement.insertBefore(logEntry, logElement.firstChild);
    
    // Keep only last 50 entries
    while (logElement.children.length > 50) {
        logElement.removeChild(logElement.lastChild);
    }
}

// ===== Load All Data =====

async function loadAllData() {
    try {
        await Promise.all([
            loadNetworks(),
            loadDHCPServers(),
            loadDevices(),
            loadTrafficPatterns()
        ]);
        updateAllUI();
    } catch (error) {
        console.error('Error loading data:', error);
        addLog(`Error loading data: ${error.message}`, 'error');
    }
}

async function loadNetworks() {
    try {
        const response = await fetch(`${API_BASE}/networks/list`);
        const data = await response.json();
        if (data.success) {
            networks = data.networks;
            console.log(`Loaded ${networks.length} networks`);
        }
    } catch (error) {
        console.error('Error loading networks:', error);
    }
}

async function loadDHCPServers() {
    try {
        const response = await fetch(`${API_BASE}/dhcp/list`);
        const data = await response.json();
        if (data.success) {
            dhcpServers = data.servers;
            console.log(`Loaded ${dhcpServers.length} DHCP servers`);
        }
    } catch (error) {
        console.error('Error loading DHCP servers:', error);
    }
}

async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE}/devices/list`);
        const data = await response.json();
        if (data.success) {
            devices = data.devices;
            console.log(`Loaded ${devices.length} devices`);
        }
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

async function loadTrafficPatterns() {
    try {
        // Load traffic patterns from each device
        trafficPatterns = [];
        for (const device of devices) {
            for (const patternId of device.active_traffic_patterns) {
                try {
                    const response = await fetch(`${API_BASE}/traffic/${patternId}/stats`);
                    const data = await response.json();
                    if (data.success) {
                        trafficPatterns.push(data.pattern);
                    }
                } catch (error) {
                    console.error(`Error loading pattern ${patternId}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error loading traffic patterns:', error);
    }
}

// ===== Network Management =====

async function createNetwork() {
    const name = document.getElementById('networkName').value;
    const subnet = document.getElementById('networkSubnet').value;
    const gateway = document.getElementById('networkGateway').value;
    const dns = document.getElementById('networkDNS').value;

    if (!name || !subnet || !gateway) {
        addLog('Please fill in all network fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/networks/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                subnet,
                gateway,
                dns_servers: dns.split(',').map(d => d.trim())
            })
        });

        const data = await response.json();
        if (data.success) {
            addLog(`✓ Network created: ${name} (${subnet})`, 'success');
            document.getElementById('networkName').value = '';
            document.getElementById('networkSubnet').value = '';
            document.getElementById('networkGateway').value = '';
            document.getElementById('networkDNS').value = '';
            await loadAllData();
        } else {
            addLog(`✗ Failed to create network: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error creating network: ${error.message}`, 'error');
    }
}

async function deleteNetwork(networkId) {
    if (!confirm('Delete this network? This will also delete all associated DHCP servers and disconnect devices.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/networks/${networkId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            addLog(`✓ Network deleted`, 'success');
            await loadAllData();
        } else {
            addLog(`✗ Failed to delete network: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error deleting network: ${error.message}`, 'error');
    }
}

function updateAllUI() {
    updateNetworksUI();
    updateDHCPUI();
    updateDevicesUI();
    updateTrafficUI();
    updateNetworkSelects();
}

function updateNetworksUI() {
    const container = document.getElementById('networksList');
    if (networks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No networks created yet</p></div>';
        return;
    }

    container.innerHTML = networks.map(net => `
        <div class="item-card">
            <h4>${net.name}</h4>
            <span class="badge success">${net.status.toUpperCase()}</span>
            <div class="item-details">
                <div><strong>Subnet:</strong> <code>${net.subnet}</code></div>
                <div><strong>Gateway:</strong> <code>${net.gateway}</code></div>
                <div><strong>DNS:</strong> ${net.dns_servers.join(', ')}</div>
                <div><strong>Created:</strong> ${new Date(net.created_at).toLocaleString()}</div>
            </div>
            <div class="button-group" style="margin-top: 10px;">
                <button class="danger" onclick="deleteNetwork('${net.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ===== DHCP Management =====

function updateNetworkSelects() {
    // Update network selects for DHCP form
    const dhcpNetworkSelect = document.getElementById('dhcpNetworkId');
    const currentValue = dhcpNetworkSelect.value;
    dhcpNetworkSelect.innerHTML = '<option value="">-- Select Network --</option>' +
        networks.map(net => `<option value="${net.id}">${net.name} (${net.subnet})</option>`).join('');
    dhcpNetworkSelect.value = currentValue;

    // Update device source for traffic
    const trafficSourceSelect = document.getElementById('trafficSourceDevice');
    const trafficCurrentValue = trafficSourceSelect.value;
    trafficSourceSelect.innerHTML = '<option value="">-- Select Device --</option>' +
        devices.map(dev => `<option value="${dev.id}">${dev.name} (${dev.device_type})</option>`).join('');
    trafficSourceSelect.value = trafficCurrentValue;

    // Update network checkboxes for device creation
    const checkboxContainer = document.getElementById('networkCheckboxes');
    checkboxContainer.innerHTML = networks.map(net => `
        <div class="checkbox-group">
            <input type="checkbox" id="net_${net.id}" value="${net.id}" name="networkCheckbox">
            <label for="net_${net.id}" style="margin-bottom: 0;">${net.name} (${net.subnet})</label>
        </div>
    `).join('');
}

function updateDHCPGateway() {
    const networkId = document.getElementById('dhcpNetworkId').value;
    const network = networks.find(n => n.id === networkId);
    if (network) {
        document.getElementById('dhcpGateway').value = network.gateway;
    } else {
        document.getElementById('dhcpGateway').value = '';
    }
}

async function createDHCPServer() {
    const networkId = document.getElementById('dhcpNetworkId').value;
    const rangeStart = document.getElementById('dhcpRangeStart').value;
    const rangeEnd = document.getElementById('dhcpRangeEnd').value;
    const leaseTime = parseInt(document.getElementById('dhcpLeaseTime').value);
    const gateway = document.getElementById('dhcpGateway').value;

    if (!networkId || !rangeStart || !rangeEnd || !gateway) {
        addLog('Please fill in all DHCP fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/dhcp/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                network_id: networkId,
                range_start: rangeStart,
                range_end: rangeEnd,
                lease_time: leaseTime,
                gateway: gateway,
                dns_servers: ["8.8.8.8", "8.8.4.4"]
            })
        });

        const data = await response.json();
        if (data.success) {
            addLog(`✓ DHCP server created for ${rangeStart} - ${rangeEnd}`, 'success');
            document.getElementById('dhcpNetworkId').value = '';
            document.getElementById('dhcpRangeStart').value = '';
            document.getElementById('dhcpRangeEnd').value = '';
            await loadAllData();
        } else {
            addLog(`✗ Failed to create DHCP server: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error creating DHCP server: ${error.message}`, 'error');
    }
}

async function updateDHCPUI() {
    const container = document.getElementById('dhcpList');
    if (dhcpServers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No DHCP servers created yet</p><p style="font-size: 12px;">Create a network first</p></div>';
        return;
    }

    let html = '';
    for (const server of dhcpServers) {
        const network = networks.find(n => n.id === server.network_id);
        const networkName = network ? network.name : 'Unknown';
        
        try {
            const response = await fetch(`${API_BASE}/dhcp/${server.id}/leases`);
            const leaseData = await response.json();
            const leaseCount = leaseData.success ? leaseData.count : 0;

            html += `
                <div class="item-card">
                    <h4>DHCP - ${networkName}</h4>
                    <span class="badge success">${server.status.toUpperCase()}</span>
                    <div class="item-details">
                        <div><strong>Network:</strong> <code>${server.subnet}</code></div>
                        <div><strong>Pool:</strong> <code>${server.range_start}</code> to <code>${server.range_end}</code></div>
                        <div><strong>Lease Time:</strong> ${server.lease_time}s</div>
                        <div><strong>Active Leases:</strong> ${leaseCount}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            html += `
                <div class="item-card">
                    <h4>DHCP - ${networkName}</h4>
                    <span class="badge success">${server.status.toUpperCase()}</span>
                    <div class="item-details">
                        <div><strong>Network:</strong> <code>${server.subnet}</code></div>
                        <div><strong>Pool:</strong> <code>${server.range_start}</code> to <code>${server.range_end}</code></div>
                    </div>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}

// ===== Device Management =====

async function createDevice() {
    const name = document.getElementById('deviceName').value;
    const deviceType = document.getElementById('deviceType').value;
    const checkboxes = document.querySelectorAll('input[name="networkCheckbox"]:checked');

    if (!name || checkboxes.length === 0) {
        addLog('Please enter device name and select at least one network', 'error');
        return;
    }

    const networkConfigs = Array.from(checkboxes).map(checkbox => ({
        network_id: checkbox.value,
        dhcp_enabled: true
    }));

    try {
        const response = await fetch(`${API_BASE}/devices/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                device_type: deviceType,
                network_configs: networkConfigs
            })
        });

        const data = await response.json();
        if (data.success) {
            addLog(`✓ Device created: ${name} (${deviceType})`, 'success');
            document.getElementById('deviceName').value = '';
            document.getElementById('deviceType').value = 'computer';
            document.querySelectorAll('input[name="networkCheckbox"]').forEach(cb => cb.checked = false);
            await loadAllData();
        } else {
            addLog(`✗ Failed to create device: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error creating device: ${error.message}`, 'error');
    }
}

async function deleteDevice(deviceId) {
    if (!confirm('Delete this device? This will stop all traffic patterns.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/devices/${deviceId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            addLog(`✓ Device deleted`, 'success');
            await loadAllData();
        } else {
            addLog(`✗ Failed to delete device: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error deleting device: ${error.message}`, 'error');
    }
}

function getDeviceTypeEmoji(type) {
    const emojis = {
        'computer': '💻',
        'phone': '📱',
        'printer': '🖨️'
    };
    return emojis[type] || '🖥️';
}

function updateDevicesUI() {
    const container = document.getElementById('devicesList');
    const totalCount = devices.length;
    const runningCount = devices.filter(d => d.status === 'running').length;
    const trafficCount = devices.filter(d => d.active_traffic_patterns && d.active_traffic_patterns.length > 0).length;

    document.getElementById('deviceCount').textContent = totalCount;
    document.getElementById('runningCount').textContent = runningCount;
    document.getElementById('trafficCount').textContent = trafficCount;

    if (devices.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No devices created yet</p></div>';
        return;
    }

    container.innerHTML = devices.map(dev => {
        const statusClass = dev.status === 'running' ? 'online' : 'offline';
        const interfacesHtml = dev.interfaces.map((iface, idx) => {
            const network = networks.find(n => n.id === iface.network_id);
            return `
                <div class="interface-item">
                    <div class="interface-info">
                        <strong>${iface.name}</strong> - ${network ? network.name : 'Unknown'} 
                        <code>${iface.ip_address || 'DHCP'}</code>
                        <span class="badge info">${iface.dhcp_enabled ? 'DHCP' : 'Manual'}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="item-card">
                <h4>
                    <span class="status-indicator ${statusClass}"></span>
                    ${getDeviceTypeEmoji(dev.device_type)} ${dev.name}
                </h4>
                <span class="badge success">${dev.status.toUpperCase()}</span>
                <span class="badge info">${dev.device_type}</span>
                ${dev.active_traffic_patterns && dev.active_traffic_patterns.length > 0 ? 
                    `<span class="badge warning">📊 ${dev.active_traffic_patterns.length} Active</span>` : ''}
                
                <div class="item-details" style="margin-top: 10px;">
                    <strong>Interfaces:</strong>
                    <div class="interface-list">${interfacesHtml}</div>
                </div>

                <div class="button-group" style="margin-top: 10px;">
                    <button class="secondary" onclick="showDeviceDetails('${dev.id}')">Details</button>
                    <button class="danger" onclick="deleteDevice('${dev.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function showDeviceDetails(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    const message = `
Device: ${device.name} (${device.device_type})
Status: ${device.status}
Created: ${new Date(device.created_at).toLocaleString()}

Interfaces:
${device.interfaces.map(iface => {
    const network = networks.find(n => n.id === iface.network_id);
    return `  ${iface.name}: ${network ? network.name : 'Unknown'} - IP: ${iface.ip_address || 'DHCP (not assigned)'} - MAC: ${iface.mac_address}`;
}).join('\n')}

Active Traffic: ${device.active_traffic_patterns ? device.active_traffic_patterns.length : 0}
    `;

    alert(message);
}

// ===== Traffic Generation =====

function updateTrafficDefaults() {
    const type = document.getElementById('trafficType').value;
    const ports = {
        'http': 80,
        'dns': 53,
        'ssh': 22,
        'ftp': 21,
        'icmp': null,
        'custom': 0
    };
    
    const port = ports[type];
    if (port !== null) {
        document.getElementById('trafficPort').value = port;
        document.getElementById('trafficPort').disabled = type === 'icmp';
    }
}

async function startTraffic() {
    const deviceId = document.getElementById('trafficSourceDevice').value;
    const trafficType = document.getElementById('trafficType').value;
    const destination = document.getElementById('trafficDestination').value;
    const port = parseInt(document.getElementById('trafficPort').value);
    const frequency = parseInt(document.getElementById('trafficFrequency').value);
    const duration = document.getElementById('trafficDuration').value ? parseInt(document.getElementById('trafficDuration').value) : null;
    const packetSize = parseInt(document.getElementById('trafficPacketSize').value);

    if (!deviceId || !destination) {
        addLog('Please select device and destination', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/traffic/start?device_id=${deviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                traffic_patterns: [{
                    pattern_type: trafficType,
                    destination: destination,
                    port: trafficType === 'icmp' ? null : port,
                    frequency: frequency,
                    duration: duration,
                    packet_size: packetSize
                }]
            })
        });

        const data = await response.json();
        if (data.success) {
            addLog(`✓ Traffic started: ${trafficType} to ${destination}:${port}`, 'success');
            document.getElementById('trafficDestination').value = '';
            await loadAllData();
        } else {
            addLog(`✗ Failed to start traffic: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error starting traffic: ${error.message}`, 'error');
    }
}

async function stopTraffic(patternId) {
    try {
        const response = await fetch(`${API_BASE}/traffic/${patternId}/stop`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            addLog(`✓ Traffic pattern stopped`, 'success');
            await loadAllData();
        } else {
            addLog(`✗ Failed to stop pattern: ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`✗ Error stopping pattern: ${error.message}`, 'error');
    }
}

function updateTrafficUI() {
    const container = document.getElementById('trafficList');
    if (trafficPatterns.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No traffic patterns active</p></div>';
        return;
    }

    container.innerHTML = trafficPatterns.map(pattern => {
        const device = devices.find(d => d.id === pattern.device_id);
        const statusClass = pattern.status === 'active' ? 'success' : pattern.status === 'paused' ? 'warning' : 'stopped';

        return `
            <div class="traffic-pattern-item ${pattern.status}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${pattern.pattern.pattern_type.toUpperCase()}</strong>
                        <span class="badge ${statusClass}">${pattern.status.toUpperCase()}</span>
                        <br>
                        <span style="font-size: 12px; color: #666;">
                            From: <code>${device ? device.name : 'Unknown'}</code> 
                            To: <code>${pattern.pattern.destination}:${pattern.pattern.port || 'N/A'}</code>
                        </span>
                        <br>
                        <span style="font-size: 12px; color: #666;">
                            📦 ${pattern.packets_sent} packets | 📊 ${(pattern.bytes_sent / 1024).toFixed(2)} KB
                        </span>
                    </div>
                    <button class="danger" onclick="stopTraffic('${pattern.id}')">Stop</button>
                </div>
            </div>
        `;
    }).join('');
}
