import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(...registerables, zoomPlugin);

const SignalStrengthChart = ({ backendUrl, port }) => {
    const [signalStrengthData, setSignalStrengthData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSignalStrengthData();
    }, []);

    const fetchSignalStrengthData = () => {
        if (!backendUrl || !port) {
            console.error('Backend URL or port not set.');
            return;
        }
        setIsLoading(true);
        axios.get(`http://${backendUrl}:${port}/signal_strength_data`)
            .then(response => {
                setSignalStrengthData(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching signal strength data:', error);
                setIsLoading(false);
            });
    };


    const minTime = signalStrengthData.length ? new Date(signalStrengthData[0].timestamp) : null;
    const maxTime = signalStrengthData.length ? new Date(signalStrengthData[signalStrengthData.length - 1].timestamp) : null;

    const data = {
        labels: signalStrengthData.map(d => new Date(d.timestamp)),
        datasets: [{
            label: 'Signal Strength',
            data: signalStrengthData.map(d => ({
                x: new Date(d.timestamp),
                y: parseInt(d.signal, 10)
            })),
            fill: false,
            borderColor: '#42A5F5',
            borderWidth: 2,
            pointRadius: 3,
            showLine: false
        }]
    };

    const options = {
        scales: {
            x: {
                type: 'time',
                bounds: 'data',  
                time: {
                    displayFormats: {
                        second: 'HH:mm:ss'
                    },
                    tooltipFormat: 'HH:mm:ss',
                    min: minTime,  
                    max: maxTime   
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Signal Strength (dBm)'
                }
            }
        },
        elements: {
            point: {
                radius: 5, 
                hitRadius: 10 
            }
        },
        plugins: {
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x', 
                },
                pan: {
                    enabled: true, 
                    mode: 'x', 
                    threshold: 10, 
                }
            }
        },
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                onClick: null 
            },
            tooltip: {
                mode: 'index',
                intersect: false 
            }
        }
    };

    return (
        <div>
            {isLoading ? <p>Loading...</p> : (
                <div style={{ height: '300px' }}>
                    <Line data={data} options={options} />
                </div>
            )}
        </div>
    );
};

export default SignalStrengthChart;
