import dhcp, ntp
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
