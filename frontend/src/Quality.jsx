import React, { useState, useEffect} from 'react';
import axios from 'axios';
import { FormLabel, Button, FormControl, Table } from 'react-bootstrap';

const Quality = () => {
  const [currentNetwork, setCurrentNetwork] = useState({});
  const [currentNetworkError, setCurrentNetworkError] = useState('');
  const [nearbyNetworks, setNearbyNetworks] = useState({});
  const [nearbyNetworksError, setNearbyNetworksError] = useState('');
  const [targetSSID, setTargetSSID] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const backendUrl = localStorage.getItem('backendUrl');
  const port = localStorage.getItem('port');

  useEffect(() => {
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setCurrentNetworkError('Please set backend URL and port in the settings.');
        return;
    }
    axios.get(`http://${backendUrl}:${port}/current_network`)
      .then(response => {
        setCurrentNetwork(response.data);
        setTargetSSID(response.data.ssid);
      })
      .catch(error => {
        console.error('Error fetching current network:', error);
        setCurrentNetworkError(error.message);
      });
  },[])

  const fetchNearbyNetworks = () => {
    setNearbyNetworksError('');
    setNearbyNetworks({});
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setNearbyNetworksError('Please set backend URL and port in the settings.');
        return;
    }
    setIsLoading(true);
    axios.post(`http://${backendUrl}:${port}/nearby_networks`, {target_ssid: targetSSID})
      .then(response => {
       // console.log('NearBY',response.data)
        setNearbyNetworks(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching nearby networks:', error);
        setNearbyNetworksError(error.message);
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
      <div style={{'paddingRight': '20px'}}>
        <h2>Nearby AP</h2>
        <FormLabel>Target SSID</FormLabel>
        <FormControl type='text' value={targetSSID} onChange={e => setTargetSSID(e.target.value)} />
        <Button onClick={fetchNearbyNetworks} className='btn-success'>Scan</Button>
        
        <div>
        {
          nearbyNetworks && Object.keys(nearbyNetworks).length > 0 ? (
          <Table striped bordered>
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
          )
          :<p></p>
        }
        </div>
      
      </div>
      <div style={{justifyContent: 'flex-end' }}>
        <h2>Current AP</h2>
        <div className='card card-success'>
          <h2>{currentNetwork.ssid}</h2>
          <p>MAC: {currentNetwork.bssid}</p>
          <p>Signal Strength: {currentNetwork.signal}</p>
          <p>TX Rate: {currentNetwork.tx}</p>
          <p>RX Rate: {currentNetwork.rx}</p>
        </div>
        {currentNetworkError && <p className='error'>{currentNetworkError}</p>}
      </div>
    </div>
  );
};

export default Quality;

