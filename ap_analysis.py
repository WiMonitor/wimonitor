import pandas as pd
import sys

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
    df = pd.read_csv(csv_path, sep=', ', engine='python')

    # filter the DataFrame to only include rows where the ESSID is the target SSID
    target_df = df[df['ESSID'] == target_ssid + ',']

    # sort the filtered DataFrame by the signal strength in descending order
    sorted_target_df = target_df.sort_values(by=dict[sort_by]['sort'], ascending=False)

    return sorted_target_df


def read_args():
    if len(sys.argv) == 1:  # interactive mode
        global target_ssid, csv_path, sort_by
        target_ssid = input('Enter the target SSID: ')
        csv_path = input('Enter the path to the CSV file: ')
        sort_by = input('Enter the column to sort by: ').lower()
    elif len(sys.argv) == 4:
        target_ssid = sys.argv[1]
        csv_path = sys.argv[2]
        sort_by = sys.argv[3].lower()
    else:
        print('Usage: python3 ap_analysis.py <target_ssid> <csv_path> <sort_by>')
        sys.exit(1)


if __name__ == '__main__':
    read_args()
    result = read_and_sort()
    best_ap = result.iloc[0]
    worst_ap = result.iloc[-1]
    print(f'{len(result)} APs detected for {target_ssid}')
    print(f'Best {sort_by}: {best_ap["BSSID"]} ('
          f'{best_ap[dict[sort_by]['sort']]} {dict[sort_by]["unit"]})')
    print(f'Worst {sort_by}: {worst_ap["BSSID"]} ('
            f'{worst_ap[dict[sort_by]["sort"]]} {dict[sort_by]["unit"]})')

    # print the sorted DataFrame with BSSID, Channel, Speed, and Power columns without the index
    print(result[['BSSID', 'channel', 'Speed', 'Power']].to_string(index=False))
