import subprocess, re, time, config
from config import selected_interface as iface


def scan_dhcp_pool():
    """Scan the DHCP pool of the selected interface

    Raises:
        ValueError: if no interface is selected (None)
        ValueError: if no IP address is found

    Returns:
        stat_dict: dictionary of statistics of the scan (scanned, up, time)
        ip_addrs: list of IP addresses found in the scan
    """

    # 1. Get CIDR with the selected interface
    if iface is None:
        raise ValueError("No interface selected")
    else:
        result = subprocess.run(["ip", "a", "show", iface], stdout=subprocess.PIPE)
        output = result.stdout.decode()
        match = re.search(r"inet (\d+\.\d+\.\d+\.\d+/\d+)", output)

        if match:
            cidr = match.group(1)
        else:
            raise ValueError("No IP address found")

    # 2. Use nmap to scan the network CIDR, extract the IP addresses
    result = subprocess.run(["nmap", "-sn", cidr], stdout=subprocess.PIPE)
    output = result.stdout.decode()
    ip_addrs = re.findall(
        r"(\d+\.\d+\.\d+\.\d+)", output
    )  # extract all IP addresses found

    # 3. Extract statistics
    stat = re.findall(r"\d+\.?\d*", output.split("\n")[-2])
    usage = "Normal" if int(stat[1])/int(stat[0]) < config.DHCP_USAGE_THRESHOLD else "High"
    stat_dict = {"scanned": stat[0], "up": stat[1], "time": stat[2], "ip_addrs": ip_addrs, "usage": usage}
    return stat_dict


def get_lease_info():
    """Get the lease information of the selected interface from the lease file

    Returns:
        lease_info_dict: dictionary of lease information parsed, see variable fields
    """
    # 1. Read lease file and find latest lease for the selected interface
    with open(config.LEASE_FILE_PATH, "r") as f:
        leases_data = f.read()

    leases = re.findall(r"lease\s+\{[^}]+\}", leases_data)
    iface_leases = [lease for lease in leases if iface in lease]
    latest_lease = iface_leases[-1]

    # 2. Parse the lease data
    fields = {
        "ip": "fixed-address\s(\d+\.\d+\.\d+\.\d+);",
        "subnet_mask": "option\ssubnet-mask\s(\d+\.\d+\.\d+\.\d+);",
        "domain_name_servers": "option\sdomain-name-servers\s(\d+\.\d+\.\d+\.\d+);",
        "dhcp_server": "option\sdhcp-server-identifier\s(\d+\.\d+\.\d+\.\d+);",
        "dhcp_lease_time": "option\sdhcp-lease-time\s(\d+);",
        "dhcp_renewal_time": "option\sdhcp-renewal-time\s(\d+);",
        "dhcp_rebinding_time": "option\sdhcp-rebinding-time\s(\d+);",
        "renew_at": "renew\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
        "rebind_at": "rebind\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
        "expire_at": "expire\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
    }

    lease_info_dict = {}
    for key, pattern in fields.items():
        match = re.search(pattern, latest_lease)
        if match:
            lease_info_dict[key] = match.group(1)
        else:
            lease_info_dict[key] = None
            
    # check if lease_info_dict is empty
    if not lease_info_dict:
        return lease_info_dict
            
    # 3. Check for lease expiration and rebinding, turn into timestamp
    now = int(time.time())
    expire_at = int(time.mktime(time.strptime(lease_info_dict["expire_at"], "%Y/%m/%d %H:%M:%S")))
    rebind_at = int(time.mktime(time.strptime(lease_info_dict["rebind_at"], "%Y/%m/%d %H:%M:%S")))
    renew_at = int(time.mktime(time.strptime(lease_info_dict["renew_at"], "%Y/%m/%d %H:%M:%S")))
    
    lease_info_dict["expire_at"] = expire_at
    lease_info_dict["rebind_at"] = rebind_at
    lease_info_dict["renew_at"] = renew_at
    lease_info_dict["now"] = now
    
    if now > expire_at:
        lease_info_dict["status"] = "Expired"
    elif now > rebind_at:
        lease_info_dict["status"] = "Rebinding"
    else:
        lease_info_dict["status"] = "Active"

    print(lease_info_dict)
    return lease_info_dict