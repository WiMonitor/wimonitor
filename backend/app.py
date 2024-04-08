from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import subprocess
import re
import datetime
from threading import Thread
import time

app = Flask(__name__)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client.network_db

scanning = False

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

@app.route('/dhcp_lease_time', methods=['GET'])
def get_lease_time():
    lease_time = get_dhcp_lease_time()
    db.dhcp_lease_time.insert_one({'lease_time': lease_time, 'timestamp': datetime.datetime.now()})
    return jsonify({'lease_time': lease_time})


@app.route('/nmap-scan', methods=['GET'])
def nmap_scan():
    # Define the target and the type of scan you want to perform
    target = "192.168.1.1"  # Replace with the target IP or range
    scan_type = "-sS"  # SYN scan

    try:
        # Build the nmap command
        command = f"nmap {scan_type} {target}"
        # Split the command to pass it safely to subprocess
        args = shlex.split(command)
        # Execute the nmap command
        output = subprocess.check_output(args).decode('utf-8')
        return jsonify({'result': output})
    except subprocess.CalledProcessError as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
