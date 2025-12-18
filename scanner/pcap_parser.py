from scapy.all import rdpcap, IP, TCP, UDP, ICMP, DNS, ARP
from collections import defaultdict
import json

class PCAPAnalyzer:
    """Analyze PCAP files for network metrics"""
    
    def __init__(self, pcap_file):
        self.pcap_file = pcap_file
        self.packets = rdpcap(str(pcap_file))
        self.stats = self._analyze()
    
    def _analyze(self):
        """Extract key metrics from packets"""
        stats = {
            'total_packets': len(self.packets),
            'packet_size_bytes': sum(len(p) for p in self.packets),
            'duration_seconds': self._get_duration(),
            'protocols': defaultdict(int),
            'top_conversations': [],
            'dns_queries': [],
            'tcp_streams': defaultdict(list),
            'packet_loss_indicators': [],
            'latency_samples': []
        }
        
        for packet in self.packets:
            # Count protocols
            if IP in packet:
                stats['protocols']['IPv4'] += 1
                if TCP in packet:
                    stats['protocols']['TCP'] += 1
                    src_dst = f"{packet[IP].src}:{packet[TCP].sport} → {packet[IP].dst}:{packet[TCP].dport}"
                    stats['tcp_streams'][src_dst].append(packet)
                elif UDP in packet:
                    stats['protocols']['UDP'] += 1
                elif ICMP in packet:
                    stats['protocols']['ICMP'] += 1
            
            if DNS in packet:
                stats['protocols']['DNS'] += 1
                if packet[DNS].qd:
                    stats['dns_queries'].append(packet[DNS].qd.qname.decode())
            
            if ARP in packet:
                stats['protocols']['ARP'] += 1
        
        return stats
    
    def _get_duration(self):
        """Calculate capture duration"""
        if not self.packets:
            return 0
        return float(self.packets[-1].time - self.packets[0].time)
    
    def get_summary(self):
        """Return human-readable summary"""
        return {
            'total_packets': self.stats['total_packets'],
            'capture_duration': f"{self.stats['duration_seconds']:.2f}s",
            'packets_per_second': round(
                self.stats['total_packets'] / max(self.stats['duration_seconds'], 1)
            ),
            'total_data': f"{self.stats['packet_size_bytes'] / 1024:.2f} KB",
            'protocols': dict(self.stats['protocols']),
            'unique_dns_queries': len(set(self.stats['dns_queries'])),
            'tcp_flows': len(self.stats['tcp_streams'])
        }
    
    def get_protocol_breakdown(self):
        """Return percentage breakdown of protocols"""
        total = sum(self.stats['protocols'].values())
        return {
            proto: round((count / total) * 100, 2)
            for proto, count in self.stats['protocols'].items()
        }
    
    def get_conversations(self, limit=10):
        """Get top talkers"""
        conversations = defaultdict(lambda: {'packets': 0, 'bytes': 0})
        
        for packet in self.packets:
            if IP in packet:
                src = packet[IP].src
                dst = packet[IP].dst
                conv_key = f"{src} → {dst}"
                conversations[conv_key]['packets'] += 1
                conversations[conv_key]['bytes'] += len(packet)
        
        return sorted(
            conversations.items(),
            key=lambda x: x[1]['bytes'],
            reverse=True
        )[:limit]
    
    def export_json(self):
        """Export analysis as JSON"""
        return {
            'summary': self.get_summary(),
            'protocol_breakdown': self.get_protocol_breakdown(),
            'top_conversations': [
                {'src_dst': k, **v} for k, v in self.get_conversations()
            ],
            'dns_queries': list(set(self.stats['dns_queries']))[:20]
        }