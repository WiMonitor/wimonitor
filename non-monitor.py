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

def ping_network(duration=5, host="google.com"):
    ping_cmd = f"ping -c {duration} {host}"
    output = subprocess.check_output(ping_cmd, shell=True).decode('utf-8')
    match = re.search(r'round-trip min/avg/max/stddev = (.*)/(.*)/(.*)/(.*) ms', output)
    if match:
        avg_speed = float(match.group(2))
        return avg_speed
    else:
        return None

def get_dhcp_info(interface='en0'):
    dhcp_cmd = f"ipconfig getpacket {interface}"
    output = subprocess.check_output(dhcp_cmd, shell=True).decode('utf-8')
    dhcp_info = {}
    for line in output.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            dhcp_info[key.strip()] = value.strip()
    return dhcp_info


if __name__ == "__main__":
    printer = Thread(target=print_all)
    printer.daemon = True
    printer.start()

    counter = 0  # Keep track of the number of rows written
    while True:
        scan_networks()
        avg_speed = ping_network()
        if avg_speed is not None:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"{timestamp} - Average network speed: {avg_speed} ms")
            with open("network_speed.txt", "a") as file:
                file.write(f"{timestamp} - Average network speed: {avg_speed} ms\n")
                if counter < 2:  # Add an extra newline after the first and second rows
                    file.write("\n")
                counter += 1

        dhcp_info = get_dhcp_info()
        print(f"DCHP Info: {dhcp_info}")
        with open("dhcp_info.txt", "a") as file:
            file.write(f"{timestamp} - DHCP Info: {dhcp_info}\n")
            if counter < 2:  
                file.write("\n")

        time.sleep(10)

