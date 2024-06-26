import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FormLabel, Button, FormControl, Table } from 'react-bootstrap';
import SignalStrengthChart from './SignalStrengthChart';

const Quality = () => {
  const [currentNetwork, setCurrentNetwork] = useState({});
  const [currentNetworkError, setCurrentNetworkError] = useState('');
  const [nearbyNetworks, setNearbyNetworks] = useState({});
  const [nearbyNetworksError, setNearbyNetworksError] = useState('');
  const [targetSSID, setTargetSSID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [isClearing, setIsClearing] = useState(false);


  const backendUrl = localStorage.getItem('backendUrl');
  const port = localStorage.getItem('port');

  useEffect(() => {
    console.log('Component mounted. Starting to fetch current network.');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
      console.error('Backend URL or port not set.');
      setCurrentNetworkError('Please set backend URL and port in the settings.');
      return;
    }
    axios.get(`http://${backendUrl}:${port}/current_network`)
      .then(response => {
        console.log('Received current network data:', response.data);
        setCurrentNetwork(response.data);
        setTargetSSID(response.data.ssid);
      })
      .catch(error => {
        console.error('Error fetching current network:', error);
        setCurrentNetworkError('Failed to fetch current network. Error: ' + error.message);
      });

         // Start signal scanning
    startSignalScanning();
  }, [backendUrl, port]);

  
  const startSignalScanning = () => {
    console.log('Starting signal scanning.');
    axios.post(`http://${backendUrl}:${port}/start_signal_monitoring`)
      .then(response => {
        console.log('Signal scanning started:', response.data);
      })
      .catch(error => {
        console.error('Error starting signal scanning:', error);
      });
  };

  const stopSignalScanning = () => {
    console.log('Stopping signal scanning.');
    axios.post(`http://${backendUrl}:${port}/stop_signal_monitoring`)
      .then(response => {
        console.log('Signal scanning stopped:', response.data);
      })
      .catch(error => {
        console.error('Error stopping signal scanning:', error);
      });
  };

  const handleClearData = () => {
    setIsClearing(true);
    axios.post(`http://${backendUrl}:${port}/clear_signal_data`)
      .then(response => {
        console.log('Data cleared:', response.data);
        setIsClearing(false);
        alert('Signal data cleared successfully!');
      })
      .catch(error => {
        console.error('Error clearing signal data:', error);
        setIsClearing(false);
        alert('Failed to clear signal data.');
      });
  };

  const fetchNearbyNetworks = () => {
    console.log('Fetching nearby networks.');
    setNearbyNetworksError('');
    setNearbyNetworks({});
    if (!backendUrl || !port || backendUrl === '' || port === '') {
      console.error('Backend URL or port not set.');
      setNearbyNetworksError('Please set backend URL and port in the settings.');
      return;
    }
    setIsLoading(true);
    axios.post(`http://${backendUrl}:${port}/nearby_networks`, { target_ssid: targetSSID })
      .then(response => {
        console.log('Nearby networks data received:', response.data);
        setNearbyNetworks(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching nearby networks:', error);
        setNearbyNetworksError('Failed to fetch nearby networks. Error: ' + error.message);
        setIsLoading(false);
      });
  }

  const isCurrentNetwork = (key) => {
    if (key == currentNetwork.bssid) {
      return {'backgroundColor': '#D4EEDA'}
    }
    else
      return {}
  }

  return (
    <div className='page-container'>
      <div style={{ paddingRight: '20px' }}>
        <h2>Nearby AP</h2>
        <FormLabel>Target SSID</FormLabel>
        <FormControl type='text' value={targetSSID} onChange={e => setTargetSSID(e.target.value)} />
        <Button onClick={fetchNearbyNetworks} className='btn-success'>Scan</Button>
        <Button onClick={() => setShowChart(!showChart)} className='btn-info'>
          {showChart ? 'Hide Signal Strength Chart' : 'Show Signal Strength Chart'}
        </Button>
        
        {isLoading ? <p>Loading...</p> : (
          <div>
            {nearbyNetworks && Object.keys(nearbyNetworks).length > 0 ? (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>SSID</th>
                    <th>MAC</th>
                    <th>Signal</th>
                    <th>Quality</th>
                    <th>Frequency</th>
                    <th>Channel</th>
                    <th>Mode</th>
                    <th>Encryption</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(nearbyNetworks).map(([key, network]) => (
                    <tr key={key} style={isCurrentNetwork(key)}>
                      <td>{network.ssid}</td>
                      <td>{network.address}</td>
                      <td>{network.signal}</td>
                      <td>{network.quality}</td>
                      <td>{network.frequency}</td>
                      <td>{network.channel}</td>
                      <td>{network.mode}</td>
                      <td>{network.encryption}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p>No nearby networks found or error occurred.</p>}
          </div>
        )}

      </div>
      <div style={{ justifyContent: 'flex-end' }}>
        <h2>Current AP</h2>
        <div className='card card-success'>
          <h2>{currentNetwork.ssid}</h2>
          <p>MAC: {currentNetwork.bssid}</p>
          <p>Signal Strength: {currentNetwork.signal}</p>
          <p>TX Rate: {currentNetwork.tx}</p>
          <p>RX Rate: {currentNetwork.rx}</p>
        </div>
        <Button variant="danger" onClick={handleClearData} disabled={isClearing} className='mb-3'>
         {isClearing ? 'Clearing...' : 'Clear Signal Strength Chart'}
        </Button>
        {currentNetworkError && <p className='error'>{currentNetworkError}</p>}
        <div>
        {showChart && <SignalStrengthChart backendUrl={backendUrl} port={port} currentNetwork={currentNetwork}/>}
        </div>
      </div>
     
    </div>
  );
};

export default Quality;
