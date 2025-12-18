#!/usr/bin/env python3
"""
NOC Dashboard Network Scanner
Performs host discovery, port scanning, service detection, and RADIUS authentication testing
"""

import nmap
import socket
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from scapy.all import ARP, Ether, srp, IP, ICMP, sr1, TCP
import subprocess
import pyrad.packet
from pyrad.client import Client
from pyrad.dictionary import Dictionary
import requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/scanner/scanner.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Data directory for storing results
DATA_DIR = Path('/data')
DATA_DIR.mkdir(exist_ok=True)

class NetworkScanner:
    """Main network scanner class"""
    
    def __init__(self):
        self.nm = nmap.PortScanner()
        self.networks = [
            '10.0.1.0/24',  # Core network
            '10.0.2.0/24',  # Edge network
            '10.0.3.0/24'   # Client network
        ]
        
    def discover_hosts_arp(self, network):
        """
        Discover active hosts using ARP scanning (Layer 2)
        Fast and reliable for local network discovery
        """
        logger.info(f"Starting ARP scan on {network}")
        discovered_hosts = []
        
        try:
            # Create ARP request packet
            arp_request = ARP(pdst=network)
            broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
            arp_request_broadcast = broadcast / arp_request
            
            # Send packet and capture response
            answered_list = srp(arp_request_broadcast, timeout=2, verbose=False)[0]
            
            for element in answered_list:
                host_info = {
                    'ip': element[1].psrc,
                    'mac': element[1].hwsrc,
                    'discovered_at': datetime.now().isoformat(),
                    'method': 'ARP'
                }
                discovered_hosts.append(host_info)
                logger.info(f"Found host: {host_info['ip']} ({host_info['mac']})")
                
        except Exception as e:
            logger.error(f"ARP scan failed for {network}: {e}")
            
        return discovered_hosts
    
    def discover_hosts_icmp(self, network):
        """
        Discover hosts using ICMP ping (Layer 3)
        More standard approach, works across routed networks
        """
        logger.info(f"Starting ICMP ping sweep on {network}")
        discovered_hosts = []
        
        try:
            # Use nmap for ICMP ping sweep
            self.nm.scan(hosts=network, arguments='-sn -PE')
            
            for host in self.nm.all_hosts():
                if self.nm[host].state() == 'up':
                    host_info = {
                        'ip': host,
                        'hostname': self.nm[host].hostname() if self.nm[host].hostname() else 'Unknown',
                        'discovered_at': datetime.now().isoformat(),
                        'method': 'ICMP'
                    }
                    discovered_hosts.append(host_info)
                    logger.info(f"Found host: {host_info['ip']} ({host_info['hostname']})")
                    
        except Exception as e:
            logger.error(f"ICMP scan failed for {network}: {e}")
            
        return discovered_hosts
    
    def scan_ports(self, host, port_range='1-1000'):
        """
        Scan ports on a specific host
        Uses both SYN scan (stealth) and service detection
        """
        logger.info(f"Scanning ports on {host}")
        port_info = {
            'host': host,
            'scan_time': datetime.now().isoformat(),
            'open_ports': [],
            'services': []
        }
        
        try:
            # SYN scan for speed, service detection for identification
            self.nm.scan(host, port_range, arguments='-sS -sV')
            
            if host in self.nm.all_hosts():
                for proto in self.nm[host].all_protocols():
                    ports = self.nm[host][proto].keys()
                    for port in ports:
                        port_state = self.nm[host][proto][port]['state']
                        if port_state == 'open':
                            service_info = {
                                'port': port,
                                'protocol': proto,
                                'state': port_state,
                                'service': self.nm[host][proto][port].get('name', 'unknown'),
                                'version': self.nm[host][proto][port].get('version', 'unknown'),
                                'product': self.nm[host][proto][port].get('product', 'unknown')
                            }
                            port_info['open_ports'].append(port)
                            port_info['services'].append(service_info)
                            logger.info(f"Open port found: {port}/{proto} - {service_info['service']}")
                            
        except Exception as e:
            logger.error(f"Port scan failed for {host}: {e}")
            
        return port_info
    
    def test_radius_auth(self, radius_server='10.0.1.10', username='testuser1', password='test123'):
        """
        Test RADIUS authentication
        This demonstrates understanding of AAA (Authentication, Authorization, Accounting)
        """
        logger.info(f"Testing RADIUS authentication for user {username}")
        
        result = {
            'server': radius_server,
            'username': username,
            'timestamp': datetime.now().isoformat(),
            'success': False,
            'message': ''
        }
        
        try:
            # Create RADIUS client
            # Note: In production, you'd use proper dictionary files
            srv = Client(
                server=radius_server,
                secret=b"network_secret_key",
                dict=Dictionary("dictionary")  # Would need proper dictionary file
            )
            
            # Create authentication request
            req = srv.CreateAuthPacket(code=pyrad.packet.AccessRequest, User_Name=username)
            req["User-Password"] = req.PwCrypt(password)
            
            # Send request
            reply = srv.SendPacket(req)
            
            if reply.code == pyrad.packet.AccessAccept:
                result['success'] = True
                result['message'] = 'Authentication successful'
                logger.info(f"RADIUS auth successful for {username}")
            else:
                result['message'] = 'Authentication failed'
                logger.warning(f"RADIUS auth failed for {username}")
                
        except Exception as e:
            result['message'] = f'Error: {str(e)}'
            logger.error(f"RADIUS test error: {e}")
            
        return result
    
    def get_routing_table(self, router_ip):
        """
        Retrieve routing table information from FRRouting routers
        Would connect via vtysh or SNMP in real implementation
        """
        logger.info(f"Attempting to retrieve routing table from {router_ip}")
        
        # In real implementation, this would use SNMP or SSH to vtysh
        # For now, we'll simulate with docker exec commands
        routing_info = {
            'router': router_ip,
            'timestamp': datetime.now().isoformat(),
            'routes': [],
            'protocols': {
                'ospf': {'status': 'unknown'},
                'bgp': {'status': 'unknown'}
            }
        }
        
        return routing_info
    
    def capture_packets(self, interface='eth0', duration=10, filter_expr='', output_file=None):
        """
        Capture network packets using tcpdump
        Returns path to PCAP file for download
        """
        logger.info(f"Starting packet capture on {interface} for {duration}s")
        
        if output_file is None:
            output_file = DATA_DIR / f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pcap"
        else:
            output_file = DATA_DIR / output_file
        
        try:
            cmd = [
                'tcpdump',
                '-i', interface,
                '-w', str(output_file),
                '-G', str(duration),
                '-W', '1'  # Keep 1 file
            ]
            
            if filter_expr:
                cmd.extend(['-f', filter_expr])
            
            subprocess.run(cmd, timeout=duration + 5, check=True)
            
            logger.info(f"Packet capture saved: {output_file}")
            return {
                'success': True,
                'file': str(output_file),
                'filename': output_file.name,
                'size_bytes': output_file.stat().st_size
            }
        except Exception as e:
            logger.error(f"Packet capture failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def list_captures(self):
        """List all available PCAP files"""
        pcaps = list(DATA_DIR.glob('*.pcap'))
        return [
            {
                'filename': p.name,
                'size_bytes': p.stat().st_size,
                'created': datetime.fromtimestamp(p.stat().st_ctime).isoformat()
            }
            for p in pcaps
        ]
    
    def full_network_scan(self):
        """
        Perform a comprehensive network scan
        This is the main function that orchestrates all scanning activities
        """
        logger.info("Starting full network scan")
        
        scan_results = {
            'scan_id': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'start_time': datetime.now().isoformat(),
            'networks_scanned': self.networks,
            'hosts': [],
            'summary': {
                'total_hosts': 0,
                'total_open_ports': 0,
                'total_services': 0
            }
        }
        
        # Discover hosts across all networks
        for network in self.networks:
            logger.info(f"Scanning network: {network}")
            
            # Use both ARP and ICMP for thorough discovery
            arp_hosts = self.discover_hosts_arp(network)
            icmp_hosts = self.discover_hosts_icmp(network)
            
            # Merge results (remove duplicates)
            all_hosts = {h['ip']: h for h in arp_hosts + icmp_hosts}
            
            # Scan ports on discovered hosts
            for ip, host_info in all_hosts.items():
                logger.info(f"Deep scanning host: {ip}")
                port_scan = self.scan_ports(ip, port_range='1-1024')
                host_info['port_scan'] = port_scan
                scan_results['hosts'].append(host_info)
                
                # Update summary
                scan_results['summary']['total_hosts'] += 1
                scan_results['summary']['total_open_ports'] += len(port_scan['open_ports'])
                scan_results['summary']['total_services'] += len(port_scan['services'])
        
        scan_results['end_time'] = datetime.now().isoformat()
        
        # Save results
        results_file = DATA_DIR / f"scan_{scan_results['scan_id']}.json"
        with open(results_file, 'w') as f:
            json.dump(scan_results, f, indent=2)
        
        logger.info(f"Scan complete. Results saved to {results_file}")
        logger.info(f"Found {scan_results['summary']['total_hosts']} hosts with "
                   f"{scan_results['summary']['total_open_ports']} open ports")
        
        return scan_results


def main():
    """Main entry point"""
    logger.info("NOC Dashboard Scanner starting up...")
    
    scanner = NetworkScanner()
    
    # Run initial full scan
    logger.info("Performing initial network scan")
    results = scanner.full_network_scan()
    
    # Keep scanner running and perform periodic scans
    scan_interval = 300  # 5 minutes
    
    logger.info(f"Scanner active. Will perform scans every {scan_interval} seconds")
    
    while True:
        try:
            time.sleep(scan_interval)
            logger.info("Starting periodic scan")
            scanner.full_network_scan()
        except KeyboardInterrupt:
            logger.info("Scanner shutting down")
            break
        except Exception as e:
            logger.error(f"Error in scan loop: {e}")
            time.sleep(60)  # Wait before retrying


if __name__ == "__main__":
    main()