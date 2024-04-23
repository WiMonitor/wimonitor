import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart, registerables} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
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
    const intervalId = setInterval(() => {
      axios.get(`http://${backendUrl}:${port}/network_speed`)
        .then(response => {
          if (Array.isArray(response.data)) {
            setChartData({
              datasets: [
                {
                  label: 'Network Speed',
                  data: response.data.map(item => ({
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
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'MMM d, h:mm a'
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

  return <Line data={chartData} options={options} />;
};

export default NetworkSpeedChart;