import wifi, subprocess, re
import config

def scan_networks(target_ssid=None):
    scan_result = wifi.Cell.all(config.selected_interface)
    current_mac = get_current_connected('mac')
    result = {}
    
    for cell in scan_result:
        if target_ssid is not None and cell.ssid != target_ssid:
            continue
        result[cell.address] = {
            'ssid': cell.ssid,
            'signal': cell.signal,
            'quality': cell.quality,
            'frequency': cell.frequency,
            'channel': cell.channel,
            'address': cell.address,
            'mode': cell.mode,
            'encryption': cell.encryption_type,
            'connected': cell.address == current_mac if current_mac else 'N/A'
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
        mac_addr=re.search(r"((?:[0-9a-fA-F]:?){12})", iw_output).group(0).upper()
        return mac_addr
    

