import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Button } from 'react-bootstrap';
import { formatISO } from 'date-fns'; 

Chart.register(...registerables);

const NetworkSpeedChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    const fetchSpeedData = () => {
      axios.post(`http://${backendUrl}:${port}/network_speed`, { action: 'fetch' })
        .then(response => {
          if (response.data && Array.isArray(response.data.network_speed)) {
            
            setChartData({
              datasets: [
                {
                  label: 'Network Speed',
                  data: response.data.network_speed.map(item => ({
                    x: new Date(item.timestamp), 
                    y: item.speed,
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
        });
    };

    fetchSpeedData();
    const intervalId = setInterval(fetchSpeedData, 10000); // Update every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  const startScan = () => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    axios.post(`http://${backendUrl}:${port}/start_scan`).catch(err => setError(err.message));
  };

  const stopScan = () => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    axios.post(`http://${backendUrl}:${port}/stop_scan`).catch(err => setError(err.message));
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
          text: 'Network Speed (ms)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Roboto Mono', sans-serif", textAlign: 'center'}}>Network Speed History</h2>
      <div className="d-flex justify-content-center">
        <Button onClick={startScan} className="mr-2">Start Scan</Button>
        <Button onClick={stopScan}>Stop Scan</Button>
      </div>
      <Line data={chartData} options={options} />
      {error && <p className="text-danger">{error}</p>}
    </div>
  );
};

export default NetworkSpeedChart;
