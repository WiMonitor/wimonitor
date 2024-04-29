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
from dns2 import test_local_dns_servers
from ntp import test_local_ntp_servers, test_ntp_servers

from flask import Flask, jsonify, request
from flask_cors import CORS
# from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)
# app.config['JWT_SECRET_KEY'] = 'wimonitor'
# jwt = JWTManager(app)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client.network_db
scanning = False

def ping_network(duration=5, host="google.com"):
    try:
        ping_cmd = f"ping -c {duration} {host}"
        output = subprocess.check_output(ping_cmd, shell=True).decode('utf-8')
        # print("Ping command output:", output)
        match = re.search(r'rtt min/avg/max/mdev = (.*)/(.*)/(.*)/(.*) ms', output)
        if match:
            avg_speed = float(match.group(2))
            # print(f"Average speed: {avg_speed} ms")
            return avg_speed
        else:
            print("No match found in ping output.") 
    except subprocess.CalledProcessError as e:
        print(f"Ping failed: {e.output.decode()}")
    return None

""" we don't need now
def scan_networks(interface='wlan0'):
    scan_cmd = f"iwlist {interface} scan"
    try:
        result = subprocess.check_output(scan_cmd, shell=True).decode('utf-8')
        networks = []
        ssid = None
        bssid = None
        channel = None
        signal_level = None
        encryption = None
        for line in result.split('\n'):
            line = line.strip()
            if line.startswith('Cell'): 
                if ssid: 
                    networks.append({
                        'SSID': ssid,
                        'BSSID': bssid,
                        'Channel': channel,
                        'dBm_Signal': signal_level,
                        'Crypto': encryption
                    })
                ssid = None
                bssid = None
                channel = None
                signal_level = None
                encryption = None
                parts = line.split()
                bssid = parts[4]
            elif 'ESSID:' in line:
                ssid = line.split('"')[1]
            elif 'Channel:' in line:
                channel = line.split(':')[1]
            elif 'Signal level=' in line:
                signal_level = line.split('=')[2].split(' ')[0]
            elif 'Encryption key:' in line:
                encryption = 'on' if 'on' in line else 'off'
        if ssid: 
            networks.append({
                'SSID': ssid,
                'BSSID': bssid,
                'Channel': channel,
                'dBm_Signal': signal_level,
                'Crypto': encryption
            })
        return networks
    except subprocess.CalledProcessError as e:
        print(f"Failed to scan networks: {e.output.decode()}")
        return []
"""


def scan_and_log():
    global scanning
    print("Scanning started...")
    while scanning:
    #   networks = scan_networks()
        avg_speed = ping_network()
        timestamp = datetime.datetime.now()
        print(f"Timestamp: {timestamp}, Avg Speed: {avg_speed}")  
        if avg_speed is not None:
            db.network_speed.insert_one({'speed': avg_speed, 'timestamp': timestamp})
            print("Data inserted into network_speed collection")    
        time.sleep(10)

@app.route('/network_speed', methods=['POST'])
def network_control():
    global scanning
    action = request.json.get('action', '')
    print(f"Received action: {action}") 

    if action == 'start':
        if not scanning:
            scanning = True
            print("Scanning started") 
            Thread(target=scan_and_log).start()
            return jsonify({'status': 'Scanning started'})
        else:
            return jsonify({'status': 'Scanning is already running'}), 400

    elif action == 'stop':
        scanning = False
        print("Scanning stopped")
        return jsonify({'status': 'Scanning stopped'})

    elif action == 'fetch':
        now = datetime.datetime.now()
        start_time = now - datetime.timedelta(hours=24)
        speed_data = list(db.network_speed.find({'timestamp': {'$gte': start_time}}, {'_id': 0}))
        for data in speed_data:
            if 'timestamp' in data:
                data['timestamp'] = data['timestamp'].isoformat()
        # print(f"Fetched data: {speed_data}") 
        return jsonify({'network_speed': speed_data})

    else:
        return jsonify({'error': 'Invalid action'}), 400

@app.route('/start_scan', methods=['POST'])
def start_scan():
    global scanning
    if not scanning:
        scanning = True
        Thread(target=scan_and_log).start()
    return jsonify({'status': 'Scanning started'})

@app.route('/stop_scan', methods=['POST'])
def stop_scan():
    global scanning
    scanning = False
    return jsonify({'status': 'Scanning stopped'})

@app.route('/dhcp_pool', methods=['GET'])
def dhcp_pool():
    try:
        return scan_dhcp_pool()
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    

@app.route('/dhcp_lease', methods=['GET'])
def dhcp_lease():
    try:
        lease_info = get_lease_info()
        return lease_info
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/dns_check', methods=['GET'])
def dns_check():
    test_domain = request.args.get('test_domain', 'google.com')
    dns_results = test_local_dns_servers(test_domain)
    return jsonify(dns_results)

@app.route('/ntp_sources', methods=['GET'])
def ntp_test():
    ntp_results = test_local_ntp_servers()
    return jsonify(ntp_results)

@app.route('/ntp_sources', methods=['POST'])
def customize_ntp_test():
    servers = request.json.get('ntp_servers', [])
    ntp_results = test_ntp_servers(servers)
    return jsonify(ntp_results)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')