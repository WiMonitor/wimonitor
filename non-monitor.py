import os
import pandas as pd
import time
import subprocess
from threading import Thread
import re
from datetime import datetime

networks = pd.DataFrame(columns=["BSSID", "SSID", "dBm_Signal", "Channel", "Crypto"])
networks.set_index("BSSID", inplace=True)

def clear_screen():
    if os.name == 'posix':
        os.system('clear')
    else:
        os.system('cls')

def print_all():
    while True:
        clear_screen()
        print(networks)
        time.sleep(0.5)

def scan_networks(interface='en0'):
    airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
    scan_cmd = f"{airport_path} --scan"
    result = subprocess.check_output(scan_cmd, shell=True).decode('utf-8')
    for line in result.split('\n'):
        parts = line.split()
        if len(parts) >= 5:
            ssid = parts[0]
            bssid = parts[1]
            channel = parts[2]
            rssi = parts[3]
            crypto = parts[-1]
            networks.loc[bssid] = [ssid, rssi, channel, crypto]

def get_dhcp_lease_time(interface='en0'):
    lease_time = None
    try:
        output = subprocess.check_output(['ipconfig', 'getoption', interface, 'lease_time'], stderr=subprocess.STDOUT).decode('utf-8').strip()
        lease_time = int(output)
    except subprocess.CalledProcessError as e:
        lease_time = f"Error: {e.output.decode('utf-8').strip()}"
    except Exception as e:
        lease_time = f"Error: {str(e)}"

    return lease_time


def ping_network(duration=5, host="google.com"):
    ping_cmd = f"ping -c {duration} {host}"
    output = subprocess.check_output(ping_cmd, shell=True).decode('utf-8')
    match = re.search(r'round-trip min/avg/max/stddev = (.*)/(.*)/(.*)/(.*) ms', output)
    if match:
        avg_speed = float(match.group(2))
        return avg_speed
    else:
        return None

if __name__ == "__main__":
    printer = Thread(target=print_all)
    printer.daemon = True
    printer.start()

    counter = 0  # Keep track of the number of rows written
    while True:
        scan_networks()
        avg_speed = ping_network()
        dhcp_lease_time = get_dhcp_lease_time()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if avg_speed is not None:
            print(f"{timestamp} - Average network speed: {avg_speed} ms, DHCP Lease Time: {dhcp_lease_time}")
            with open("network_speed.txt", "a") as file:
                file.write(f"{timestamp} - Average network speed: {avg_speed} ms, DHCP Lease Time: {dhcp_lease_time}\n")
                if counter < 2:  # Add an extra newline after the first and second rows
                    file.write("\n")
                counter += 1
        # Write DHCP lease time to a separate file
        with open("dhcp_lease.txt", "a") as file:
            file.write(f"{timestamp} - DHCP Lease Time: {dhcp_lease_time}\n")
        time.sleep(10)

