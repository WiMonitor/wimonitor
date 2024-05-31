import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Button, Form } from 'react-bootstrap';

Chart.register(...registerables);

const NetworkSpeedChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [pingAddr, setPingAddr] = useState('google.com');
  const [pingInterval, setPingInterval] = useState(5); 
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const positionRef = useRef({ latitude: null, longitude: null });


  const backendUrl = localStorage.getItem('backendUrl');
  const port = localStorage.getItem('port');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
        position => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            console.log(`Location set: Latitude ${position.coords.latitude}, Longitude ${position.coords.longitude}`);
        },
        error => {
            setError('Failed to retrieve location: ' + error.message);
        }
    );
}, []);



  useEffect(() => {
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    axios.get(`http://${backendUrl}:${port}/ping_status`)
      .then(response => {
        setIsScanning(response.data.scanning);
        if (response.data.scanning) {
          setPingAddr(response.data.ping_addr);
          setPingInterval(response.data.ping_interval);
        }
      })
      .catch(error => {
        console.error('Error fetching scan status:', error);
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    let watchId = null;
    const updatePosition = () => {
        setLatitude(positionRef.current.latitude);
        setLongitude(positionRef.current.longitude);
    };

    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            position => {
                positionRef.current = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            },
            error => {
                setError('Failed to retrieve location: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );

        const intervalId = setInterval(updatePosition, 5000); // Update every 5 seconds

        return () => {
            clearInterval(intervalId);
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }
}, []);


  useEffect(() => {
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    const fetchSpeedData = () => {
      axios.post(`http://${backendUrl}:${port}/network_speed`)
        .then(response => {
          if (response.data && Array.isArray(response.data.network_speed)) {
            setChartData({
              datasets: [
                {
                  label: 'Network Latency',
                  data: response.data.network_speed.map(item => ({
                    x: new Date(item.timestamp), 
                    y: item.speed,
                    lat: item.latitude,
                    lng: item.longitude  
                  })),
                  fill: false,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                }
              ]
            });
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setError(error.message);
        });
    };

    let intervalId;
    if (isScanning) {
      fetchSpeedData();
      intervalId = setInterval(fetchSpeedData, pingInterval*1000);
    }
    return () => clearInterval(intervalId);
  }, [isScanning]);

  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      axios.post(`http://${backendUrl}:${port}/clear_data`)
        .then(response => {
          alert('All data cleared');
          setChartData({ datasets: [] });
        })
        .catch(error => {
          console.error('Error clearing data:', error);
          setError(error.message);
        });
    }
  };

  const startScan = () => {
    setIsScanning(true);
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    console.log(`Sending request to ${backendUrl}:${port} with address ${pingAddr}, latitude: ${latitude}, longitude: ${longitude}`);
    axios.post(`http://${backendUrl}:${port}/start_scan`, { 
      'ping_addr':pingAddr, 
      'ping_interval':pingInterval,
      'latitude': latitude,  
      'longitude': longitude 
    })
    .then(response => {
     // console.log('Scan started:', response.data);
    })
      .catch(err => {
        setError(err.message);
        setIsScanning(false); 
      });
  };

  const stopScan = () => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    axios.post(`http://${backendUrl}:${port}/stop_scan`)
      .then(() => setIsScanning(false))
      .catch(err => {
        setError(err.message);
      });
  };

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'MMM d, h:mm a',
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Latency (ms)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw.y != null) {
              label += `${context.raw.y} ms`;
            }
            if (context.raw.lat && context.raw.lng) {
              label += `\nLat: ${context.raw.lat.toFixed(5)}, Lng: ${context.raw.lng.toFixed(5)}`;
            }
            return label;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Roboto Mono', sans-serif", textAlign: 'center'}}>Ping</h2>
      <p>Latitude: {latitude}</p>
      <p>Longitude: {longitude}</p>
      <div style={{display:'flex'}}>
        {/* add a input for the ping addr */}
        <Form.Label>Address</Form.Label>
        <Form.Control type="text" placeholder="Enter the address to ping, google.com if empty" value={pingAddr} onChange={e => setPingAddr(e.target.value)} />
        <Form.Label>Interval (seconds)</Form.Label>
        <Form.Control type="number" placeholder="" value={pingInterval} onChange={e => setPingInterval(e.target.value)} />
      </div>
      <div className="d-flex justify-content-center">
        <Button onClick={startScan} disabled={isScanning} className="mr-2 btn-success">Start Monitor</Button>
        <Button onClick={stopScan} disabled={!isScanning}>Stop Monitor</Button>
        <Button onClick={clearData} disabled={isScanning} className="mr-2 btn-danger">Clear All Data</Button>
      </div>
      <Line data={chartData} options={options} />
      {error && <p className="text-danger">{error}</p>}
    </div>
  );
};

export default NetworkSpeedChart;
