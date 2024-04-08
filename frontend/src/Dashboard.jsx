import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import NetworkSpeedChart from './NetworkSpeedChart.jsx';

const Dashboard = () => {
  const [speedData, setSpeedData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get('http://localhost:5000/network_speed');
      setSpeedData(result.data);
    };
    fetchData();
  }, []);

  return (
    <Container>
      <Row>
        <Col>
          <h2>Network Speed History</h2>
          <NetworkSpeedChart data={speedData} />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
