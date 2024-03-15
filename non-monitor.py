from wifi import Cell
import os
import pandas
import time
from threading import Thread

networks = pandas.DataFrame(columns=["BSSID", "SSID", "dBm_Signal", "Channel", "Crypto"])
networks.set_index("BSSID", inplace=True)
    
def print_all():
    while True:
        os.system("clear")
        print(networks)
        time.sleep(0.5)



if __name__ == "__main__":
    # start the thread that prints all the networks
    printer = Thread(target=print_all)
    printer.daemon = True
    printer.start()
    while True:
        cells = Cell.all('wlan0')
        # if the network with the specified ssid is found, print the details
        target_ssid = "Konoha"
        for cell in cells:
            if cell.ssid == target_ssid:
                # add it to the dataframe
                networks.loc[cell.address] = (cell.ssid, cell.signal, cell.channel, cell.encryption_type)
            