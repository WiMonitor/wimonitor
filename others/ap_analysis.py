import pandas as pd
import sys
import subprocess
import time

# global variables
sort_by = 'Power'
target_ssid = ''
csv_path = ''

dict = {
    'channel': {
        'unit': '',
        'sort': 'channel'
    },
    'speed': {
        'unit': 'Mbps',
        'sort': 'Speed'
    },
    'power': {
        'unit': 'dBm',
        'sort': 'Power'
    }
}


def read_and_sort():
    try:
        df = pd.read_csv(csv_path, sep=', ', engine='python')
        # filter the DataFrame to only include rows where the ESSID is the target SSID
        target_df = df[df['ESSID'] == target_ssid + ',']
        sorted_target_df = target_df.sort_values(by=dict[sort_by]['sort'], ascending=False)
    except Exception as e:
        print(f'Error reading CSV file: {e}')
        sys.exit(1)
    return sorted_target_df

def read_args():
    if len(sys.argv) == 1:  # interactive mode
        global target_ssid, csv_path, sort_by
        target_ssid = input('Enter the target SSID: ')
        csv_path = input('Enter the path to the CSV file: ')
        sort_by_input = input('Enter the column to sort by: ').lower()
        if sort_by_input in dict:
            sort_by = sort_by_input
        else:
            print(f'Invalid sort_by value: {sort_by_input}. Expected values are {list(dict.keys())}.')
            sys.exit(1)
    elif len(sys.argv) == 4:
        target_ssid = sys.argv[1]
        csv_path = sys.argv[2]
        sort_by_input = sys.argv[3].lower()
        if sort_by_input in dict:
            sort_by = sort_by_input
        else:
            print(f'Invalid sort_by value: {sort_by_input}. Expected values are {list(dict.keys())}.')
            sys.exit(1)
    else:
        print('Usage: python3 ap_analysis.py <target_ssid> <csv_path> <sort_by>')
        sys.exit(1)

def ping_public_network(host="google.com", duration=20):
    start_time = time.time()
    end_time = start_time + duration
    print(f"Pinging {host} for {duration} seconds...")
    while time.time() < end_time:
        try:
            output = subprocess.check_output(['ping', '-c', '1', host], universal_newlines=True)
            print(output)
        except subprocess.CalledProcessError as e:
            print(f"Failed to ping {host}: {e}")
        time.sleep(1)  # Wait 1 second between pings
    print("Ping test completed.")


if __name__ == '__main__':
    read_args()
    result = read_and_sort()
    best_ap = result.iloc[0]
    worst_ap = result.iloc[-1]
    print(f'{len(result)} APs detected for {target_ssid}')
    print(f'Best {sort_by}: {best_ap["BSSID"]} ('
          f'{best_ap[dict[sort_by]["sort"]]} {dict[sort_by]["unit"]})')
    print(f'Worst {sort_by}: {worst_ap["BSSID"]} ('
          f'{worst_ap[dict[sort_by]["sort"]]} {dict[sort_by]["unit"]})')

    # Ping a public network for a specified duration
    ping_public_network(duration=3600)

    # print the sorted DataFrame with BSSID, Channel, Speed, and Power columns without the index
    print(result[['BSSID', 'channel', 'Speed', 'Power']].to_string(index=False))

