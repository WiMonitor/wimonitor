import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DhcpInfo = () => {
  const [dhcpData, setDhcpData] = useState([]);

  useEffect(() => {
    const fetchDhcpData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/dhcp_pool');
        console.log('Data received:', response.data);
        setDhcpData(prevData => [...prevData, response.data]);
      } catch (error) {
        console.error('Error fetching DHCP data:', error);
      }
    };

    fetchDhcpData();
    const intervalId = setInterval(fetchDhcpData, 30000); // Fetch every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <div>
      <h2>DHCP Pool and Lease Info</h2>
      {dhcpData.map((data, index) => (
        <div key={index}>
          <h3>Pool Info:</h3>
          <p>Scanned: {data.stats.scanned}, Up: {data.stats.up}, Time: {data.stats.time}</p>
          <h3>IP Addresses:</h3>
          <ul>
            {data.addresses.map((addr, idx) => <li key={idx}>{addr}</li>)}
          </ul>
          <h3>Lease Info:</h3>
          <p>IP: {data.lease_info.ip}, Lease Time: {data.lease_info.dhcp_lease_time}</p>
        </div>
      ))}
    </div>
  );
};

export default DhcpInfo;
