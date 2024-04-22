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

import config
from dhcp import scan_dhcp_pool, get_lease_info
from dns2 import test_local_dns_servers
from ntp import test_local_ntp_servers

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

def scan_networks(interface='en0'):
    airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
    scan_cmd = f"{airport_path} --scan"
    result = subprocess.check_output(scan_cmd, shell=True).decode('utf-8')
    networks = []
    for line in result.split('\n'):
        parts = line.split()
        if len(parts) >= 5:
            ssid = parts[0]
            bssid = parts[1]
            channel = parts[2]
            rssi = parts[3]
            crypto = parts[-1]
            networks.append({'SSID': ssid, 'BSSID': bssid, 'Channel': channel, 'dBm_Signal': rssi, 'Crypto': crypto})
    return networks


def get_dhcp_lease_time(interface='en0'):
    try:
        output = subprocess.check_output(['ipconfig', 'getoption', interface, 'lease_time'], stderr=subprocess.STDOUT).decode('utf-8').strip()
        lease_time = int(output)
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

def scan_and_log():
    global scanning
    while scanning:
        scan_networks()
        avg_speed = ping_network()
        dhcp_lease_time = get_dhcp_lease_time()
        timestamp = datetime.datetime.now()
        if avg_speed is not None:
            db.network_speed.insert_one({'speed': avg_speed, 'timestamp': timestamp, 'dhcp_lease_time': dhcp_lease_time})
        time.sleep(10)

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

@app.route('/networks', methods=['GET'])
def get_networks():
    networks_data = scan_networks()
    db.networks.insert_many(networks_data)
    networks_without_id = list(db.networks.find({}, {'_id': 0}))
    return jsonify(networks_without_id)

@app.route('/network_speed', methods=['GET'])
def get_network_speed_history():
    now = datetime.datetime.now()
    start_time = now - datetime.timedelta(hours=24)
    speed_data = list(db.network_speed.find({'timestamp': {'$gte': start_time}}, {'_id': 0}))
    return jsonify(speed_data)

@app.route('/dhcp_pool', methods=['GET'])
def dhcp_pool():
    try:
        # Get DHCP pool information
        stat_dict, ip_addrs = scan_dhcp_pool()

        # Get lease information
        lease_info = get_lease_info()

        # Return both sets of information in one response
        return jsonify({
            'status': 'success',
            'stats': stat_dict,
            'addresses': ip_addrs,
            'lease_info': lease_info
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/dns_check', methods=['GET'])
def dns_check():
    test_domain = request.args.get('test_domain', 'google.com')
    dns_results = test_local_dns_servers(test_domain)
    return jsonify(dns_results)

@app.route('/ntp_sources', methods=['GET'])
def ntp_test():
    ntp_results = test_local_ntp_servers()
    return jsonify(ntp_results)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
