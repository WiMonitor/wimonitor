<h2 align="center">WiMonitor</h2>
<p align="center">
    A network monitoring project.

# Authors
* **[Yunhao Jiang](https://github.com/yunhao-jiang)** 
* **[Georgia Li](https://github.com/nori210)**  

# Motivation
- The monitored environment has multile servers and several medical devices are connected to the public network. This project will focus on station monitoring that can provide insights on the performance and reliability.

# Monitored Environment
- The project is based on linux system (Linux Kernel 6.1.57). We used a Raspberry Pi as the development environment. Our current development environment cannot achieve high accuracy, which may lead to results that differ from the actual application.
# Usage
* Users should set the tested IP and port number at the home page before they go to other tabs.
* Network Ping Test
  * We take average rtt as our data.
  * Users can directly save the image to local.
  ![ping result](images/ping.png "sample result")
  * "Clear All Data" button will clear up the database.
* WiFI Quality
  * We use `iwlist` and `iw dev <interface> link` to scan the connected and nearby access point
  * We use `wpa_cli` to monitor the conneted access point. Note that `iw` can't handle WPA. 
  * For the visualization, to show the chart functionality the logic is extracting the connected APs every specific interval (hardcoded in backend) since in current development environment only one access point is available. This should be changed. Ideally the user case should be the user can see the variance when roaming between different APs.
* Speed
  * We integrated [Speed-Test](https://github.com/openspeedtest/Speed-Test) for this part.
  * Ideally continuous tests are preferred. We didn't make change due to the 
* DHCP lease and DHCP pool scan
  * We use nmap to scan the ip.
  * Users can set threshold of dhcp usage in `backend/config.py`.
* NTP Source
  * We test connection to NTP servers.
  ![ntp result](images/ntp.png "sample ntp result")
  * The changelog is suggested to be kept no more than 24 hours.
* DNS lookup
  * Users can input hostname or ip address.

# Get Started
To install all the dependency in the backend, run
  ```sh
 cd backend
  ```
then
  ```sh
 pip install -r requirements.txt
  ```
To start the backend, we use `sudo` to accomendate `wpa` and `iw` command, run
  ```sh
 sudo python3 backend/app.py
  ```
To install all the dependency in the frontend, run
  ```sh
 cd frontend
  ```
then
  ```sh
 npm install
  ```

To start database, run
  ```sh
  docker run --name mongodb -p 27017:27017 -d mongo
  ```
# Customize Setting

Change your system setting in `backend/config.py`


_The path of DHCP Lease may vary from systems to system._


# Future Features

_We left several potential features to be implemented._

For exisiting features:
* Change the current logic (such as for signal strength quality chart) to adapt to the user case
* Build changelog for exisiting functionalities, such as NTP analysis
* Build visualization for exisiting functionalities, such as NTP analysis

For features we have planned but didn't develop:
*  Deep packet inspection (Intrusion Protection System)
*  MTU path discovery
# Credit
 [Speed-Test](https://github.com/openspeedtest/Speed-Test) 