import pandas as pd
import sys

# read from arguments the target WiFi SSID, and the path to the CSV file
if len(sys.argv) != 3:
    print('Usage: python ap_analysis.py <target_ssid> <csv_path>')
    sys.exit(1)
target_ssid = sys.argv[1]
csv_path = sys.argv[2]
print('Target SSID:', target_ssid)

# read the CSV file into a pandas DataFrame and first row is the header

df = pd.read_csv(csv_path, sep=', ', engine='python')

# filter the DataFrame to only include rows where the ESSID is the target SSID
target_df = df[df['ESSID'] == target_ssid + ',']

# sort the filtered DataFrame by the signal strength in descending order
sorted_target_df = target_df.sort_values(by='Power', ascending=False)

# print the best and the worst signal strength
best = sorted_target_df.iloc[0]
worst = sorted_target_df.iloc[-1]
print(f'Best signal strength: {best['Power']} dBm, MAC ADDR: {best['BSSID']}, with Speed: '
      f'{best['Speed']} Mbps on Channel: {best['channel']}')
print(f'Worst signal strength: {worst['Power']} dBm, MAC ADDR: {worst['BSSID']}, with Speed: '
        f'{worst['Speed']} Mbps on Channel: {worst['channel']}')

