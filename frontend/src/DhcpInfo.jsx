import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DhcpInfo = () => {
  const [dhcpLeaseTimes, setDhcpLeaseTimes] = useState([]);

  useEffect(() => {
    const fetchDhcpLeaseTime = async () => {
      try {
        const response = await axios.get('http://localhost:5000/dhcp_lease_time');
        setDhcpLeaseTimes(prevTimes => [...prevTimes, response.data]);
      } catch (error) {
        console.error('Error fetching DHCP lease time:', error);
      }
    };

    fetchDhcpLeaseTime(); 
    const intervalId = setInterval(fetchDhcpLeaseTime, 30000); // Fetch every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <div>
      <h2>DHCP Lease Time History</h2>
      <ul>
        {dhcpLeaseTimes.map((leaseTime, index) => (
          <li key={index}>Time: {leaseTime.lease_time}, Recorded at: {new Date(leaseTime.timestamp).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
};

export default DhcpInfo;
