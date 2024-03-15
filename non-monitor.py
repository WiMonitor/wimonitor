import os
import pandas as pd
import time
import subprocess
from threading import Thread

networks = pd.DataFrame(columns=["BSSID", "SSID", "dBm_Signal", "Channel", "Crypto"])
networks.set_index("BSSID", inplace=True)

def print_all():
    while True:
        os.system("clear")
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

if __name__ == "__main__":
    printer = Thread(target=print_all)
    printer.daemon = True
    printer.start()

    while True:
        scan_networks()
        time.sleep(5)
