# Virtual Clients System - Setup Verification

## Pre-Launch Checklist

### ✅ Backend Files Created
- [ ] `app/services/virtual_infrastructure.py` exists (~700 lines)
- [ ] `app/api/routes/devices.py` exists (~300 lines)
- [ ] Files are properly formatted Python

### ✅ Backend Files Modified
- [ ] `app/models.py` has new models (search for "NetworkInfo")
- [ ] `app/main.py` imports devices module
- [ ] `app/main.py` registers devices router

### ✅ Frontend Files Created
- [ ] `dashboard/devices.html` exists (~400 lines)
- [ ] `dashboard/devices.js` exists (~500 lines)
- [ ] Files are properly formatted HTML/JS

### ✅ Frontend Files Modified
- [ ] `dashboard/index.html` has Virtual Devices button

### ✅ Documentation Files Created
- [ ] `VIRTUAL_DEVICES_GUIDE.md` exists
- [ ] `VIRTUAL_CLIENTS_IMPLEMENTATION_SUMMARY.md` exists
- [ ] `VIRTUAL_CLIENTS_QUICK_REFERENCE.md` exists

---

## Launch Verification

### Step 1: Start Containers
```bash
cd noc-dashboard
docker-compose down  # Clean stop
docker-compose up -d # Start fresh
docker-compose ps    # Verify all running
```

Expected containers:
- [ ] router1
- [ ] router2
- [ ] radius
- [ ] scanner
- [ ] dns (dnsmasq)
- [ ] dashboard
- [ ] client1
- [ ] client2

### Step 2: Check API is Responding
```bash
curl http://localhost:3000/api/health
```

Expected: `{ "success": true, "status": "healthy", ... }`

### Step 3: Check Devices Routes
```bash
curl http://localhost:3000/api/devices/networks/list
curl http://localhost:3000/api/devices/dhcp/list
curl http://localhost:3000/api/devices/devices/list
curl http://localhost:3000/api/devices/device-types
```

Expected: `{ "success": true, "networks": [], "count": 0 }`

### Step 4: Access Dashboard
- Open: `http://localhost:5174`
- [ ] Dashboard loads
- [ ] Main page shows buttons
- [ ] Virtual Devices button visible

### Step 5: Load Device Configuration Page
- Click "🖥️ Virtual Devices" button
- [ ] Page loads
- [ ] Four sections visible:
  - 📡 Virtual Networks
  - 🔄 DHCP Servers
  - 🖥️ Virtual Devices
  - 🌐 Traffic Generation
- [ ] Activity log shows at bottom
- [ ] Forms are interactive

---

## Functional Testing

### Test 1: Create Network

**Action:**
1. Fill Network form:
   - Name: "Test Net"
   - Subnet: "10.0.1.0/24"
   - Gateway: "10.0.1.1"
   - DNS: "8.8.8.8"
2. Click "Create Network"

**Expected Results:**
- [ ] Success message in activity log
- [ ] Network appears in "Active Networks"
- [ ] Network details visible (subnet, gateway)
- [ ] No error in browser console
- [ ] Network ID starts with "net_"

**Verify:**
```bash
curl http://localhost:3000/api/devices/networks/list
# Should show created network
```

### Test 2: Create DHCP Server

**Action:**
1. Select "Test Net" from Network dropdown
2. Fill DHCP form:
   - Pool Start: "10.0.1.10"
   - Pool End: "10.0.1.254"
   - Lease Time: 3600
3. Click "Create DHCP Server"

**Expected Results:**
- [ ] Gateway auto-populated
- [ ] Success message in activity log
- [ ] DHCP server appears in list
- [ ] Shows subnet and pool range
- [ ] No error in console
- [ ] Server ID starts with "dhcp_"

**Verify:**
```bash
curl http://localhost:3000/api/devices/dhcp/list
# Should show DHCP server
```

### Test 3: Create Device with DHCP

**Action:**
1. Check "Test Net" checkbox
2. Fill Device form:
   - Name: "Lab PC"
   - Type: "computer"
3. Click "Create Device"

**Expected Results:**
- [ ] Device appears in list
- [ ] Shows interface eth0
- [ ] IP assigned from pool (10.0.1.10)
- [ ] Status shows "running" (green)
- [ ] MAC address displayed
- [ ] Device count updates to 1
- [ ] Device ID starts with "dev_"

**Verify:**
```bash
curl http://localhost:3000/api/devices/devices/list
# Should show device with assigned IP
```

### Test 4: Create Multiple Devices

**Action:**
1. Create "Lab PC 2" (Computer)
2. Create "Printer" (Printer type)
3. Create "Phone" (Phone type)

**Expected Results:**
- [ ] All 3 devices created
- [ ] Each gets unique IP (10.0.1.10, 10.0.1.11, etc.)
- [ ] Device count shows 3
- [ ] Device types show correct icons
- [ ] Running count shows 3
- [ ] No IP conflicts

### Test 5: Assign Manual IP

**Action:**
1. Click "Details" on first device
2. Manually assign IP:
   - Interface: eth0
   - IP: 10.0.1.100
   - Network: Test Net
3. Send POST request:
```bash
curl -X POST http://localhost:3000/api/devices/devices/dev_xxx/assign-ip \
  -H "Content-Type: application/json" \
  -d '{
    "interface_name": "eth0",
    "ip_address": "10.0.1.100",
    "network_id": "net_yyy"
  }'
```

**Expected Results:**
- [ ] IP changes to 10.0.1.100
- [ ] DHCP flag removed
- [ ] No error message
- [ ] Device still running

### Test 6: Start Traffic Pattern

**Action:**
1. Select "Lab PC" as source
2. Fill traffic form:
   - Type: ICMP
   - Destination: 10.0.1.1
   - Frequency: 5
3. Click "Start Traffic"

**Expected Results:**
- [ ] Pattern appears in "Active Traffic Patterns"
- [ ] Shows source device name
- [ ] Shows destination IP
- [ ] Status shows "active"
- [ ] Packets sent count > 0
- [ ] Bytes sent > 0
- [ ] Pattern ID starts with "pat_"
- [ ] Pattern can be stopped

**Verify:**
```bash
curl http://localhost:3000/api/devices/traffic/pat_xxx/stats
# Should show increasing packet count
```

### Test 7: HTTP Traffic

**Action:**
1. Start traffic:
   - Type: HTTP
   - Destination: 10.0.1.2
   - Port: 80
   - Frequency: 5s

**Expected Results:**
- [ ] Traffic pattern created
- [ ] Port shows 80
- [ ] Type shows "http"
- [ ] Packets incrementing

### Test 8: Stop Traffic

**Action:**
1. Click "Stop" on active pattern

**Expected Results:**
- [ ] Pattern disappears from active list
- [ ] Activity log shows stop message
- [ ] Packets sent count preserved
- [ ] No errors

### Test 9: Delete Device

**Action:**
1. Click "Delete" on device
2. Confirm deletion

**Expected Results:**
- [ ] Device removed from list
- [ ] Associated traffic patterns stopped
- [ ] Device count decreases
- [ ] No error message
- [ ] Data persists after page reload

### Test 10: Delete Network

**Action:**
1. Click "Delete" on network
2. Confirm deletion

**Expected Results:**
- [ ] Network removed
- [ ] Only if no DHCP/devices
- [ ] Otherwise shows error
- [ ] Error message is clear

---

## Data Persistence Test

### Action:
1. Create 1 network
2. Create 1 DHCP server
3. Create 2 devices
4. Start traffic pattern
5. Stop containers: `docker-compose down`
6. Start containers: `docker-compose up -d`
7. Reload page

### Expected Results:
- [ ] Network still exists
- [ ] DHCP server still exists
- [ ] Devices still exist
- [ ] All IPs preserved
- [ ] Traffic pattern stopped (as expected)

**Verify:**
```bash
curl http://localhost:3000/api/devices/networks/list
# Should show network
curl http://localhost:3000/api/devices/devices/list
# Should show devices with IPs
```

---

## Error Handling Tests

### Test: Create Duplicate Network
**Action:** Try creating network with same subnet

**Expected:** Error message about duplicate

### Test: Invalid Subnet
**Action:** Enter "10.0.1.1/33" (invalid prefix)

**Expected:** Error about invalid CIDR

### Test: IP Outside Network
**Action:** Manual IP "10.0.2.1" in "10.0.1.0/24" network

**Expected:** Error about IP not in subnet

### Test: Create Device Without Network
**Action:** Try creating device with no network selected

**Expected:** Error about selecting network

### Test: DHCP Before Server
**Action:** Create device with DHCP on network without DHCP server

**Expected:** Error about no DHCP server

### Test: Invalid Port
**Action:** Traffic with port 70000

**Expected:** Error about port range

---

## Performance Tests

### Test: Many Devices
1. Create 20 devices
2. Start 10 traffic patterns
3. Check refresh rate

**Expected:**
- [ ] UI responsive (< 1s load)
- [ ] No console errors
- [ ] Consistent data
- [ ] CPU usage reasonable

### Test: Long Running
1. Start traffic
2. Wait 5 minutes
3. Check stats

**Expected:**
- [ ] Packet count increases
- [ ] Bytes accumulate
- [ ] No memory leaks
- [ ] Still responsive

---

## Integration Tests

### PCAP Analyzer Integration
1. Create network and device
2. Start traffic (HTTP to 10.0.1.1)
3. Wait 30 seconds
4. Go to PCAP Analyzer
5. Select recent capture
6. Analyze

**Expected:**
- [ ] PCAP file captured
- [ ] Analyzer loads traffic
- [ ] Shows protocol breakdown
- [ ] Shows conversations
- [ ] HTTP traffic visible

---

## Browser Console Check

Open browser console (F12) and verify:
- [ ] No errors
- [ ] No warnings about missing files
- [ ] No CORS errors
- [ ] No 404s for API calls
- [ ] All API responses successful

---

## Documentation Check

- [ ] Can access guides
- [ ] Guide describes workflow
- [ ] API examples match implementation
- [ ] Troubleshooting covers common issues
- [ ] Quick reference is helpful

---

## Final Verification

| Component | Status | Notes |
|-----------|--------|-------|
| Backend models | ✅/❌ | |
| Backend routes | ✅/❌ | |
| Backend service | ✅/❌ | |
| Frontend HTML | ✅/❌ | |
| Frontend JS | ✅/❌ | |
| API endpoints | ✅/❌ | |
| Data persistence | ✅/❌ | |
| Error handling | ✅/❌ | |
| Documentation | ✅/❌ | |
| PCAP integration | ✅/❌ | |

---

## Success Criteria

System is ready when:
- ✅ All API endpoints respond
- ✅ Can create networks
- ✅ Can create DHCP servers
- ✅ Can create devices
- ✅ Can assign IPs (DHCP + Manual)
- ✅ Can generate traffic
- ✅ Traffic data captured
- ✅ Data persists
- ✅ No console errors
- ✅ Documentation complete

**If all above checked: System is READY! 🎉**

---

## Troubleshooting During Verification

| Issue | Solution |
|-------|----------|
| API not responding | Check: `docker logs noc_api` |
| Models not found | Verify imports in main.py |
| Routes not working | Check devices.py syntax |
| Frontend won't load | Check: browser console, nginx logs |
| Data not persisting | Verify volume mount in docker-compose |
| Traffic not captured | Check scanner interface names |

---

**Verification Checklist v1.0**
Generated: December 19, 2025
Status: Ready for Testing
