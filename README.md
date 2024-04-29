<h2 align="center">WiMonitor</h2>
<p align="center">
    A network monitoring project.

# Authors
* **[Yunhao Jiang](https://github.com/yunhao-jiang)** 
* **[Georgia Li](https://github.com/nori210)**  

# Usage
1. Set endpoint on at the home page
2. Network Speed Test
3. DHCP Lease and DHCP pool scan
4. NTP Source
5. DNS lookup

# Get Started
To install all the dependency in the backend, run
  ```sh
 cd backend
  ```
then
  ```sh
 pip install -r requirements.txt
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

