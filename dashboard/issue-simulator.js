/**
 * Network Issue Simulator
 * Simulates failures for troubleshooting game mode
 */

const SIMULATED_ISSUES = {
    'bgp-down': {
        name: 'BGP Session Down',
        severity: 'critical',
        affectedServices: ['router2-reachability'],
        description: 'BGP peer 10.0.2.2 is not responding',
        expectedDiagnosis: 'port-check-179'
    },
    'radius-failure': {
        name: 'RADIUS Authentication Failure',
        severity: 'high',
        affectedServices: ['authentication'],
        description: 'RADIUS server not responding to auth requests',
        expectedDiagnosis: 'radius-test'
    },
    'dns-timeout': {
        name: 'DNS Resolution Timeout',
        severity: 'medium',
        affectedServices: ['name-resolution'],
        description: 'DNS queries timing out (>2000ms)',
        expectedDiagnosis: 'dns-lookup'
    },
    'packet-loss': {
        name: 'High Packet Loss on Link',
        severity: 'high',
        affectedServices: ['10.0.2.0/24'],
        description: '25% packet loss detected between routers',
        expectedDiagnosis: 'ping-test'
    }
};

let activeIssues = [];

/**
 * Start a troubleshooting scenario
 */
function startTroubleshootingScenario(issueType) {
    const issue = SIMULATED_ISSUES[issueType];
    if (!issue) {
        addLog('Unknown issue type selected.', 'error');
        return;
    }
    activeIssues.push({
        ...issue,
        id: `${issueType}-${Date.now()}`,
        startTime: Date.now(),
        solved: false
    });
    addLog(`🚨 Issue detected: ${issue.name}`, 'error');
    patchAPIResponses(issueType);
    showIssueBanner(issue);
}

/**
 * Patch API responses to simulate the issue
 */
function patchAPIResponses(issueType) {
    // Save original fetch if not already patched
    if (!window._originalFetch) {
        window._originalFetch = window.fetch;
    }
    window.fetch = async function(...args) {
        const response = await window._originalFetch.apply(this, args);
        const clone = response.clone();
        // Intercept and modify responses based on issue
        if (issueType === 'bgp-down' && args[0].includes('bgp/summary')) {
            return new Response(JSON.stringify({
                success: true,
                peers: [{ state: 'Idle', ip: '10.0.2.2' }]
            }));
        }
        if (issueType === 'radius-failure' && args[0].includes('radius/test')) {
            return new Response(JSON.stringify({
                success: false,
                authenticated: false,
                message: 'RADIUS server unreachable (timeout)'
            }));
        }
        if (issueType === 'dns-timeout' && args[0].includes('dns-lookup')) {
            return new Response(JSON.stringify({
                success: false,
                resolved: false,
                query_time: 5000
            }));
        }
        if (issueType === 'packet-loss' && args[0].includes('ping')) {
            return new Response(JSON.stringify({
                success: true,
                packet_loss_pct: 25,
                avg_rtt: 45
            }));
        }
        return clone;
    };
}

/**
 * Check if user fixed the issue
 */
function validateIssueFix(diagnosisType) {
    const issue = activeIssues[activeIssues.length - 1];
    if (!issue) return false;
    if (issue.expectedDiagnosis === diagnosisType) {
        issue.solved = true;
        addLog(`✅ Correct diagnosis! ${issue.name} requires: ${diagnosisType}`, 'info');
        showIssueBanner(null);
        return true;
    } else {
        addLog(`❌ Not the right diagnostic. Try: ${issue.expectedDiagnosis}`, 'warning');
        return false;
    }
}

/**
 * Show or hide the issue banner in the UI
 */
function showIssueBanner(issue) {
    let banner = document.getElementById('issue-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'issue-banner';
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.width = '100%';
        banner.style.background = '#ff4444';
        banner.style.color = '#fff';
        banner.style.padding = '12px 0';
        banner.style.textAlign = 'center';
        banner.style.zIndex = '9999';
        document.body.appendChild(banner);
    }
    if (issue) {
        banner.innerHTML = `<strong>Simulated Issue:</strong> ${issue.name} - ${issue.description}`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

// Expose functions globally for UI integration
window.startTroubleshootingScenario = startTroubleshootingScenario;
window.validateIssueFix = validateIssueFix;