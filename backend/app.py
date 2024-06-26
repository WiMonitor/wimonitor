from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import subprocess
import re
import datetime
from threading import Thread
import time
import shlex
import socket
from bson.json_util import dumps

import config
from dhcp import scan_dhcp_pool, get_lease_info
from dns2 import get_local_dns_servers, test_dns_connectivity
from ntp import test_local_ntp_servers, test_ntp_servers
from quality import scan_networks,get_current_connected

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client.network_db
scanning = False
last_scan_addr = None
last_scan_interval = None

@app.route('/local_dns_config', methods=['GET'])
def local_dns_servers():
    """
    Retrieves the local DNS server configuration.
    
    Returns:
        json: A JSON object containing the local DNS server addresses.
    """
    return jsonify(get_local_dns_servers())
    

def ping_network(duration, host):
    """
    Performs a ping operation to a specified host for a given duration and extracts the average round-trip time.
    
    Parameters:
        duration: The number of ping echo requests to send.
        host: The target hostname or IP address to ping.
    
    Returns:
        The average round-trip time in milliseconds.
    """
    try:
        ping_cmd = f"ping -c {duration} {host}"
        output = subprocess.check_output(ping_cmd, shell=True).decode('utf-8')
        match = re.search(r'rtt min/avg/max/mdev = (.*)/(.*)/(.*)/(.*) ms', output)
        if match:
            avg_speed = float(match.group(2))
            return avg_speed
        else:
            print("No match found in ping output.") 
    except subprocess.CalledProcessError as e:
        print(f"Ping failed: {e.output.decode()}")
    return None


def scan_and_log(ping_addr="google.com", ping_interval=5):
    """
    Continuously pings a specified address at set intervals and logs the results to the MongoDB database.
    
    Parameters:
        ping_addr (str): The address to ping.
        ping_interval (int): The interval in seconds between pings.
    """
    global scanning
    while scanning:
        
        avg_speed = ping_network(ping_interval, ping_addr)
        timestamp = datetime.datetime.now()
        if avg_speed is not None:
            db.network_speed.insert_one({
                'speed': avg_speed, 
                'timestamp': timestamp
                })  
            
@app.route('/network_speed', methods=['POST'])
def network_control():
    """
    Retrieves network speed data from the database.
    
    Returns:
        json: A JSON array of network speed records during the monitored intervals.
    """
    global scanning

    now = datetime.datetime.now()
    start_time = now - datetime.timedelta(hours=24)
    speed_data = list(db.network_speed.find({'timestamp': {'$gte': start_time}}, {'_id': 0}))
    for data in speed_data:
        if 'timestamp' in data:
            data['timestamp'] = data['timestamp'].isoformat()
    return jsonify({'network_speed': speed_data})

@app.route('/start_scan', methods=['POST'])
def start_scan():
    """
    Startes the continuous network scanning process.
    
    Request JSON Parameters:
        ping_addr (str): The address to ping.
        ping_interval (int): The interval in seconds between pings.

    Returns:
        json: A JSON object indicating the status of the scan initiation.
    """
    global scanning, last_scan_addr, last_scan_interval
    ping_address = request.json.get('ping_addr') 
    ping_interval = request.json.get('ping_interval')

    last_scan_addr = ping_address
    last_scan_interval = ping_interval

    if not scanning:
        scanning = True
        Thread(target=scan_and_log, args=(ping_address,ping_interval)).start()
    return jsonify({'status': 'Scanning started'})

@app.route('/stop_scan', methods=['POST'])
def stop_scan():
    """
    Stops the ongoing network scanning process.

    Returns:
        json: A JSON object indicating that the scanning process has been stopped.
    """
    global scanning
    scanning = False
    return jsonify({'status': 'Scanning stopped'})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    """
    Clears all ping data from the database.

    Returns:
        json: A JSON object indicating that all data has been cleared from the database.
    """
    db.network_speed.delete_many({})
    return jsonify({'status': 'All the data cleared'})

@app.route('/dhcp_pool', methods=['GET'])
def dhcp_pool():
    """
    Retrieves information about the DHCP pool.

    Returns:
        json: A JSON object containing the DHCP pool data or an error message if the operation fails.
    """
    try:
        return scan_dhcp_pool()
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    

@app.route('/dhcp_lease', methods=['GET'])
def dhcp_lease():
    """
    Retrieves DHCP lease information.

    Returns:
        json: A JSON object containing DHCP lease information or an error message if the operation fails.
    """
    try:
        lease_info = get_lease_info()
        return lease_info
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/dns_check', methods=['POST'])
def dns_check():
    """
    Performs DNS resolution tests for a specified domain using specified DNS servers.

    Request JSON Parameters:
        test_domain: The domain to test DNS resolution for.
        dns_servers: A list of DNS servers to use for testing.

    Returns:
        json: A JSON object containing the results of the DNS tests.
    """
    test_domain = request.json.get('test_domain')
    dns_servers = request.json.get('dns_servers')
    dns_results = test_dns_connectivity(dns_servers, test_domain)
    return jsonify(dns_results)

@app.route('/ntp_sources', methods=['GET'])
def ntp_test():
    """
    Tests connectivity to local NTP servers.

    Returns:
        json: A JSON object containing the results of the NTP connectivity test.
    """
    ntp_results = test_local_ntp_servers()
    return jsonify(ntp_results)

@app.route('/ntp_sources', methods=['POST'])
def customize_ntp_test():
    """
    Tests connectivity to custom NTP servers specified in the request.

    Request JSON Parameters:
        ntp_servers: A list of NTP servers to test.

    Returns:
        json: A JSON object containing the results of the custom NTP server tests.
    """
    servers = request.json.get('ntp_servers', [])
    ntp_results = test_ntp_servers(servers)
    return jsonify(ntp_results)


@app.route('/ping_status', methods=['GET'])
def ping_status():
    """
    Provides the current status of the network scanning process.

    Returns:
        json: A JSON object containing the current status, ping address, and ping interval of the scanning process.
    """
    status_dict = {}
    status_dict['scanning'] = scanning
    status_dict['ping_addr'] = last_scan_addr
    status_dict['ping_interval'] = last_scan_interval
    return jsonify(status_dict)


@app.route('/nearby_networks', methods=['POST'])
def scan_ap():
    """
    Scans for available networks nearby based on the SSID provided in the request.

    Request JSON Parameters:
        target_ssid (str | None): The target SSID to scan for. If empty or null, scans for all available SSIDs.

    Returns:
        json: A JSON object containing the results of the network scan.
    """
    target_ssid = None if request.json.get('target_ssid') == '' else request.json.get('target_ssid')
    result = scan_networks(target_ssid)
    return jsonify(result)


@app.route('/current_network', methods=['GET'])
def current_connected():
    """
    Retrieves information about the currently connected network.

    Returns:
        json: A JSON object containing details of the currently connected network.
    """
    return jsonify(get_current_connected())

def fetch_ap_details():
    """
    Use wpa_cli to scan and fetch details of all visible networks.
    """
    try:
        # Using wpa_cli to scan and get results
        subprocess.run(["wpa_cli", "-i", config.selected_interface, "scan"], check=True)
        time.sleep(2)
        scan_output = subprocess.check_output(["wpa_cli", "-i", config.selected_interface, "scan_results"], text=True)
       # print("Current status output:", status_output)  

        ap_details = []
        for line in scan_output.splitlines():
            if re.match(r"bssid / frequency / signal level / flags / ssid", line):
                continue 
            parts = line.split()
            if len(parts) >= 5:
                ap_details.append({
                    'bssid': parts[0],
                    'frequency': parts[1],
                    'signal': parts[2],
                    'flags': parts[3],
                    'ssid': ' '.join(parts[4:])
                })
        return ap_details
    except subprocess.CalledProcessError:
        print("Failed to fetch AP details.")
        return []

def get_min_signal(ap_details):
    """
    Extract the minimum signal strength from the list of access points.
    """
    if not ap_details:
        return None
    return min(ap_details, key=lambda x: x['signal'])

@app.route('/start_signal_monitoring', methods=['POST'])
def start_signal_monitoring():
    global scanning
    if not scanning:  # Check if scanning is not already running
        scanning = True
        thread = Thread(target=monitor_and_log_signal)
        thread.start()
        print("reached started")
        return jsonify({'status': 'Signal monitoring started'})
        
    else:
        print("not reached started")
        return jsonify({'status': 'Signal monitoring is already active'})

@app.route('/stop_signal_monitoring', methods=['POST'])
def stop_signal_monitoring():
    global scanning
    if scanning:
        scanning = False
        return jsonify({'status': 'Signal monitoring stopped'})
    else:
        return jsonify({'status': 'Signal monitoring was not active'})

def monitor_and_log_signal():
    global scanning
    print(f"Starting monitor_and_log_signal with scanning={scanning}")
    target_ssid = "Dev"
    while scanning:
        ap_details = fetch_ap_details()
        if ap_details:
            connected_ap = next((ap for ap in ap_details if ap['ssid'] == target_ssid), None)
            if connected_ap:
                insert_result = db.signal_strength_logs.insert_one({
                    'timestamp': datetime.datetime.now(),
                    **connected_ap
                })
                # print(f"Inserted data: {insert_result.inserted_id}, {connected_ap}")
        time.sleep(10)  # Interval in seconds between scans


@app.route('/signal_strength_data', methods=['GET'])
def get_signal_strength_data():
    """ Retrieve signal strength data for all APs, sorted by AP and timestamp """
    data = []
    results = db.signal_strength_logs.find().sort('timestamp', 1)
    results_list = list(results) 
    for record in results_list:
        data.append({
            'timestamp': record['timestamp'].isoformat(),
            'ssid': record['ssid'],
            'bssid': record['bssid'],
            'signal': record['signal']
        })
    return jsonify(data)


@app.route('/clear_signal_data', methods=['POST'])
def clear_signal_data():
    """ Clears all signal strength data from the database. """
    db.signal_strength_logs.delete_many({})  
    return jsonify({'status': 'Data cleared successfully'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')