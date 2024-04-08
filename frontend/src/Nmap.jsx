import React, { useState } from 'react';
import axios from 'axios';

const Nmap = () => {
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await axios.get('http://localhost:5000/nmap-scan');
      setScanResult(response.data.result);
    } catch (error) {
      console.error('Error performing Nmap scan:', error);
      setScanResult('Failed to perform scan.');
    }
    setIsScanning(false);
  };

  return (
    <div>
      <h2>Nmap Scan Results</h2>
      <button onClick={handleScan} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'Start Nmap Scan'}
      </button>
      <pre>{scanResult}</pre>
    </div>
  );
};

export default Nmap;