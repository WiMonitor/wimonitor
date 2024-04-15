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
            <li><Link to="/dhcp_lease_time">DHCP Info</Link></li>
            <li><Link to="/nmap">Nmap</Link></li>
            <li><Link to="/ntp-sources">NTP Sources</Link></li> 
            <li><Link to="/dns-lookup">DNS Lookup</Link></li> 
          </ul>
        </nav>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/network-speed" element={<NetworkSpeedChart />} />
          <Route path="/dhcp_lease_time" element={<DhcpInfo />} />
          <Route path="/nmap" element={<Nmap />} />
          <Route path="/ntp-sources" element={<NTPSources />} />
          <Route path="/dns-lookup" element={<DNSLookup />} /> 
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

const Home = () => (
  <div>
    <h1>Welcome to the Network Monitoring App</h1>
    <p>Select a page from the menu above to get started.</p>
  </div>
);

export default App;
