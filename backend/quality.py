import subprocess
import re
import config

def scan_networks(target_ssid=None):
    # Use iwlist to scan for networks
    try:
        scan_output = subprocess.check_output(['sudo', 'iwlist', config.selected_interface, 'scan'], text=True)
    except subprocess.CalledProcessError:
        print("Failed to scan WiFi networks.")
        return None
    
    networks = re.findall(r"Cell \d+ - Address: (\S+).*?ESSID:\"(.*?)\".*?Quality=(\d+/\d+).*?Signal level=(\S+ dBm).*?Frequency:(\S+ GHz).*?Channel:(\d+).*?Mode:(\S+).*?Encryption key:(\S+)", scan_output, re.S)
    result = {}
    
    # Filter by target SSID if specified
    for address, ssid, quality, signal, frequency, channel, mode, encryption in networks:
        if target_ssid is not None and ssid != target_ssid:
            continue
        result[address] = {
            'ssid': ssid,
            'signal': signal,
            'quality': quality,
            'frequency': frequency,
            'channel': channel,
            'address': address,
            'mode': mode,
            'encryption': encryption,
            'connected': address == get_current_connected('mac')
        }
        
    return result

def get_current_connected(type='all'):
    try:
        iw_output = subprocess.check_output(["iw", "dev", config.selected_interface, "link"], text=True)
    except subprocess.CalledProcessError:
        print("Failed to get WiFi connection details.")
        return None

    if type == 'all':
        result = {}
        result['bssid'] = re.search(r"((?:[0-9a-fA-F]:?){12})", iw_output).group(0).upper()
        result['ssid'] = re.search(r"SSID: (.+)", iw_output).group(1)
        result['signal'] = re.search(r"signal: (-\d+ dBm)", iw_output).group(1)
        result['tx'] = re.search(r"tx bitrate: (.+)", iw_output).group(1)
        result['rx'] = re.search(r"rx bitrate: (.+)", iw_output).group(1)
        return result
        
    elif type == 'mac':
        mac_addr = re.search(r"((?:[0-9a-fA-F]:?){12})", iw_output).group(0).upper()
        return mac_addr

