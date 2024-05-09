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
from quality import *

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
    return jsonify(get_local_dns_servers())
    

def ping_network(duration, host):
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
    global scanning
    while scanning:
        
        avg_speed = ping_network(ping_interval, ping_addr)
        timestamp = datetime.datetime.now()
        if avg_speed is not None:
            db.network_speed.insert_one({'speed': avg_speed, 'timestamp': timestamp})  
            
@app.route('/network_speed', methods=['POST'])
def network_control():
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
    global scanning
    scanning = False
    return jsonify({'status': 'Scanning stopped'})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    db.network_speed.delete_many({})
    return jsonify({'status': 'All the data cleared'})

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


@app.route('/dns_check', methods=['POST'])
def dns_check():
    test_domain = request.json.get('test_domain')
    dns_servers = request.json.get('dns_servers')
    dns_results = test_dns_connectivity(dns_servers, test_domain)
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


@app.route('/ping_status', methods=['GET'])
def ping_status():
    status_dict = {}
    status_dict['scanning'] = scanning
    status_dict['ping_addr'] = last_scan_addr
    status_dict['ping_interval'] = last_scan_interval
    return jsonify(status_dict)


@app.route('/nearby_networks', methods=['POST'])
def scan_ap():
    target_ssid = None if request.json.get('target_ssid') == '' else request.json.get('target_ssid')
    result = scan_networks(target_ssid)
    return jsonify(result)


@app.route('/current_network', methods=['GET'])
def current_connected():
    return jsonify(get_current_connected())
    

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')