import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Button  } from 'react-bootstrap';
import NetworkSpeedChart from './NetworkSpeedChart.jsx';

const Dashboard = () => {
  const [speedData, setSpeedData] = useState([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      axios.get('http://localhost:5000/network_speed')
        .then(result => {
          setSpeedData(result.data);
        });
    }, 10000);  // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const startScan = () => {
    axios.post('http://localhost:5000/start_scan');
  };

  const stopScan = () => {
    axios.post('http://localhost:5000/stop_scan');
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