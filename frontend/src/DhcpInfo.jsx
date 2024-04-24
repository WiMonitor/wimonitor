import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DhcpInfo = () => {
  const [dhcpLease, setDhcpLease] = useState({});
  const [leaseError, setLeaseError] = useState('');
  const [dhcpPool, setDhcpPool] = useState({});
  const [poolError, setPoolError] = useState('');

  useEffect(() => {
        setLeaseError('');
        const backendUrl = localStorage.getItem('backendUrl');
        const port = localStorage.getItem('port');
        if (!backendUrl || !port || backendUrl === '' || port === '') {
            setLeaseError('Please set backend URL and port in the settings.');
            return;
        }

        axios.get(`http://${backendUrl}:${port}/dhcp_lease`)
          .then(response => {
            setDhcpLease(response.data);
            console.log(response.data);
            if (Object.keys(response.data).length === 0) {
              setLeaseError('No DHCP lease found.');
            }
          })
          .catch(error => {
            if (error.response) {
              setLeaseError('Error fetching DHCP lease: ' + error.response.data.message);
            }
            else {
              setLeaseError('Error fetching DHCP lease: ' + error.message);
            }
          });
  }, []);
  const convertSecToTime = (sec) => {
    sec = parseInt(sec);
    let days = Math.floor(sec / 86400);
    let hours = Math.floor((sec % 86400) / 3600);
    let minutes = Math.floor(((sec % 86400) % 3600) / 60);
    let seconds = ((sec % 86400) % 3600) % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  const fetchDhcpPool = async () => {
    setPoolError('');
    setDhcpPool({});
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setPoolError('Please set backend URL and port in the settings.');
        return;
    }

    axios.get(`http://${backendUrl}:${port}/dhcp_pool`)
    .then(response => {
      setDhcpPool(response.data);
      console.log(response.data);
    })
    .catch(error => {
      if (error.response) {
        setPoolError('Error fetching DHCP pool: ' + error.response.data.message);
      }
      else {
        setPoolError('Error fetching DHCP pool: ' + error.message);
      }
    });
  }
   

  return (
    <div className='page-container'>
      <div className='dhcp-lease'>
        <h2>DHCP Lease</h2>       
        {Object.keys(dhcpLease).length > 0 ? (
          <div className={
            dhcpLease['status'] === 'Active' ? 'card card-success' : dhcpLease['status'] === 'Expired' ? 'card card-error' : 'card card-warning'
          }>
            <h2>{dhcpLease['status']}</h2>
            <h3>{dhcpLease['ip']}</h3>
            <h4><i>Lease Configuration</i></h4>
            <p><b>Renew Time:</b> {dhcpLease['dhcp_renewal_time']}s ({convertSecToTime(dhcpLease['dhcp_renewal_time'])})</p>
            <p><b>Rebind Time:</b> {dhcpLease['dhcp_rebinding_time']}s ({convertSecToTime(dhcpLease['dhcp_rebinding_time'])})</p>
            <p><b>Lease Time:</b> {dhcpLease['dhcp_lease_time']}s ({convertSecToTime(dhcpLease['dhcp_lease_time'])})</p>
            <br />
            <h4><i>Upcoming Schedule</i></h4>
            <p><b>Renew At:</b> {new Date(parseInt(dhcpLease['renew_at'])*1000).toLocaleString()} ({convertSecToTime(dhcpLease['renew_at']-dhcpLease['now'])} left)</p>
            <p><b>Rebind At:</b> {new Date(parseInt(dhcpLease['rebind_at'])*1000).toLocaleString()} ({convertSecToTime(dhcpLease['rebind_at']-dhcpLease['now'])} left)</p>
            <p><b>Expire At:</b> {new Date(parseInt(dhcpLease['expire_at'])*1000).toLocaleString()} ({convertSecToTime(dhcpLease['expire_at']-dhcpLease['now'])} left)</p>
            <br />
            <h4><i>Client Information</i></h4>
            <p><b>DHCP Server:</b> {dhcpLease['dhcp_server']}</p>
            <p><b>Domain Name Servers: </b> {dhcpLease['domain_name_servers']}</p>
            <p><b>Subnet Mask:</b> {dhcpLease['subnet_mask']}</p>

          </div>
        ) : (<div className='card card-error'><h2>{leaseError}</h2></div>)}
     
      </div>
      <div className='dhcp-pool'>
        <h2>DHCP Pool</h2>
        
        <button onClick={fetchDhcpPool}>Scan</button>
        {Object.keys(dhcpPool).length > 0 ? (
          <div className=''>
            <div className={
              dhcpPool['usage'] === "Normal" ? 'card card-success' : 'card card-warning'
            }>
              <h3>Usage: {dhcpPool['usage']}</h3>
              <h1>{dhcpPool['scanned']-dhcpPool['up']}/{dhcpPool['scanned']}</h1>
              <h4>Available</h4>
              <p>Time Spend: {dhcpPool['time']}s</p>
            </div>
            <br />
            <div className='card'>
              <h3>IPs (Responded)</h3>
              {dhcpPool['ip_addrs'].map((ip) => (
                <p key={ip}>{ip}</p>
              ))}
            </div>
          </div>
        ) : (<p>{poolError}</p>)
        }
        <p><i>This will trigger full nmap scan over the entire subnet.</i></p>
        <p><i>This only provides an estimation of the DHCP pool.</i></p>
      </div>
    </div>
  );
};

export default DhcpInfo;
