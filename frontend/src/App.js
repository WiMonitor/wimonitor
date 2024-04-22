import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import NetworkSpeedChart from './NetworkSpeedChart.jsx'; 
import DhcpInfo from './DhcpInfo.jsx'; 
import Nmap from './Nmap.jsx'; 
import NTPSources from './NTPSources.jsx';
import DNSLookup from './DNSLookup.jsx'; 

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
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/network-speed">Network Speed</Link></li>
            <li><Link to="/dhcp_pool">DHCP Info</Link></li>
            <li><Link to="/nmap">Nmap</Link></li>
            <li><Link to="/ntp-sources">NTP Sources</Link></li> 
            <li><Link to="/dns-lookup">DNS Lookup</Link></li> 
          </ul>
        </nav>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/network-speed" element={<NetworkSpeedChart />} />
          <Route path="/dhcp_pool" element={<DhcpInfo />} />
          <Route path="/nmap" element={<Nmap />} />
          <Route path="/ntp-sources" element={<NTPSources />} />
          <Route path="/dns-lookup" element={<DNSLookup />} /> 
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const [backendUrl, setBackendUrl] = useState('');
  const [port, setPort] = useState('');
  
  
  const handleSubmit = (e) => {
    sessionStorage.setItem('backendUrl', backendUrl);
    sessionStorage.setItem('port', port);
    alert('Backend URL and Port saved successfully');
  }

  return (
    <div>
      <h1>Welcome to the Network Monitoring App</h1>
      <p>Select a page from the menu above to get started.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor='Backend URL'>Backend URL:</label>
        <input id='Backend URL' type="text" name="backendUrl" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
        <label htmlFor='Port'>Port:</label>
        <input id='Port' type="text" name="port" value={port} onChange={(e) => setPort(e.target.value)} />
        <button type="submit">Save</button>
      </form>
      <br />
      <p>Current Setting:</p>
      <label>Backend URL: {sessionStorage.getItem('backendUrl') === null ? "Not Set": sessionStorage.getItem('backendUrl')}; </label>
      <label>Port: {sessionStorage.getItem('port') === null ? "Not Set": sessionStorage.getItem('port')}</label>
    </div>
  );
}

export default App;
