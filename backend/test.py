import dhcp, ntp, dns2
from config import selected_interface as iface
    
if __name__ == "__main__":
    print("[Testing scan_dhcp_pool]")
    stat, ip_addrs = dhcp.scan_dhcp_pool()
    print(stat)
    print(ip_addrs)
    
    print("[Testing get_lease_info]")
    print(dhcp.get_lease_info())
    
    print("[Testing test_ntp_servers with given input]")
    print(ntp.test_ntp_servers(["time.google.com", "time.apple.com", "time.windows.com", "google.com"])) # the last one should fail
    
    print("[Testing test_local_ntp_servers, this reads the local NTP config file, no input needed]")
    print(ntp.test_local_ntp_servers())
    
    print("[Testing test_local_dns_servers with time.google.com]")
    print(dns2.test_local_dns_servers("time.google.com")) # this should success, dns_reachable and resolution_success should be True, resolved_ips should have more than 1
    
    print("[Testing test_dns_connectivity with time.google.com, BAD DNS addr]")
    print(dns2.test_dns_connectivity(["22.22.22.22"], "time.google.com")) # this should fail, dns_reachable should be False
    
    print("[Testing test_dns_connectivity with time.google.com, GOOD DNS addr, but BAD domain]")
    print(dns2.test_dns_connectivity(["1.1.1.1"], "bad.domain")) # this should fail, resolution_success should be False, but dns_reachable should be True
   