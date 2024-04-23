import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Button  } from 'react-bootstrap';
import NetworkSpeedChart from './NetworkSpeedChart.jsx';

const Dashboard = () => {
  const [speedData, setSpeedData] = useState([]);
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
        .then(result => {
          setSpeedData(result.data);
        });
    }, 10000);  // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const startScan = () => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    axios.post(`http://${backendUrl}:${port}/start_scan`);
  };

  const stopScan = () => {
    const backendUrl = localStorage.getItem('backendUrl');
    const port = localStorage.getItem('port');
    if (!backendUrl || !port || backendUrl === '' || port === '') {
        setError('Please set backend URL and port in the settings.');
        return;
    }
    axios.post(`http://${backendUrl}:${port}/stop_scan`);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h2>Network Speed History</h2>
          <Button onClick={startScan}>Start Scan</Button>
          <Button onClick={stopScan} className="ml-2">Stop Scan</Button>
          <NetworkSpeedChart data={speedData} />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;