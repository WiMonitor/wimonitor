import subprocess, re, os, config
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
    stat_dict = {"scanned": stat[0], "up": stat[1], "time": stat[2]}

    return stat_dict, ip_addrs


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
        "subnet-mask": "option\ssubnet-mask\s(\d+\.\d+\.\d+\.\d+);",
        "domain-name-servers": "option\sdomain-name-servers\s(\d+\.\d+\.\d+\.\d+);",
        "dhcp-server": "option\sdhcp-server-identifier\s(\d+\.\d+\.\d+\.\d+);",
        "dhcp-lease-time": "option\sdhcp-lease-time\s(\d+);",
        "dhcp-renewal-time": "option\sdhcp-renewal-time\s(\d+);",
        "dhcp-rebinding-time": "option\sdhcp-rebinding-time\s(\d+);",
        "renew-at": "renew\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
        "rebind-at": "rebind\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
        "expire-at": "expire\s\d+\s(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2});",
    }

    lease_info_dict = {}
    for key, pattern in fields.items():
        match = re.search(pattern, latest_lease)
        if match:
            lease_info_dict[key] = match.group(1)
        else:
            lease_info_dict[key] = None

    return lease_info_dict
