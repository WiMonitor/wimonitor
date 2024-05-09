import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import NetworkSpeedChart from './NetworkSpeedChart.jsx'; 
import DhcpInfo from './DhcpInfo.jsx'; 
import Quality from './Quality.jsx'; 
import NTPSources from './NTPSources.jsx';
import DNSLookup from './DNSLookup.jsx'; 
import Speedtest from './Speedtest.jsx';

function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const handleToggle = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  return (
    <Router>
      <div className="App">
      <button className="nav-toggle" aria-label="toggle navigation" onClick={handleToggle}>Menu</button>
        <nav>
        <ul className={isNavCollapsed ? "collapsed" : ""}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/quality">WiFi Quality</Link></li>
            <li><Link to="/speedtest">Speed</Link></li>
            <li><Link to="/ping">Ping</Link></li>
            <li><Link to="/dhcp_pool">DHCP</Link></li>
            <li><Link to="/ntp-sources">NTP</Link></li> 
            <li><Link to="/dns-lookup">DNS</Link></li> 
          </ul>
        </nav>
        <Routes>
          <Route path="/ping" element={<NetworkSpeedChart />} />
          <Route path="/dhcp_pool" element={<DhcpInfo />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/ntp-sources" element={<NTPSources />} />
          <Route path="/dns-lookup" element={<DNSLookup />} /> 
          <Route path="/" element={<Home />} />
          <Route path="/speedtest" element={<Speedtest />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const [backendUrl, setBackendUrl] = useState('');
  const [port, setPort] = useState('');
  
  
  const handleSubmit = (e) => {
    localStorage.setItem('backendUrl', backendUrl);
    localStorage.setItem('port', port);
    alert('Backend URL and Port saved successfully');
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-3" style={{ fontFamily: "'Roboto Mono', sans-serif" }}>Welcome to the Network Monitoring App</h1>
      <p className="mb-4">Select a page from the menu above to get started.</p>
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="row g-3 align-items-center justify-content-center">
          <div className="col-auto">
            <label htmlFor='backendUrl' className="col-form-label">Backend URL:</label>
          </div>
          <div className="col-auto">
            <input 
              id='backendUrl' 
              type="text" 
              className="form-control" 
              name="backendUrl" 
              value={backendUrl} 
              onChange={(e) => setBackendUrl(e.target.value)} 
            />
          </div>
          <div className="col-auto">
            <label htmlFor='port' className="col-form-label">Port:</label>
          </div>
          <div className="col-auto">
            <input 
              id='port' 
              type="text" 
              className="form-control" 
              name="port" 
              value={port} 
              onChange={(e) => setPort(e.target.value)} 
            />
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-success">Save</button>
          </div>
        </div>
      </form>
      <div>
        <p>Current Setting:</p>
        <p>Backend URL: {localStorage.getItem('backendUrl') || "Not Set"}; </p>
        <p>Port: {localStorage.getItem('port') || "Not Set"}</p>
      </div>
    </div>
  );
}

export default App;
