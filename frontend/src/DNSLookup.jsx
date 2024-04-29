import React, { useState } from 'react';
import axios from 'axios';

const DNSLookup = () => {
    const [hostname, setHostname] = useState('');
    const [dnsInfo, setDnsInfo] = useState([]);
    const [error, setError] = useState('');

    const fetchDNSInfo = async () => {
        const backendUrl = localStorage.getItem('backendUrl') || 'localhost';
        const port = localStorage.getItem('port') || '3000';
        
        console.log(`Fetching DNS info from http://${backendUrl}:${port}/dns_check`);
        
        try {
            const response = await axios.get(`http://${backendUrl}:${port}/dns_check`, {
                params: { test_domain: hostname }
            });
            console.log('API response:', response.data);
            const newDnsRecord = { hostname, info: response.data };
            setDnsInfo(prevDnsInfo => [...prevDnsInfo, newDnsRecord]);
            setError('');
        } catch (error) {
            console.error('Failed to fetch DNS information:', error);
            setError('Failed to fetch DNS information: ' + error.message);
        }
    };

    const deleteRecord = (index) => {
        setDnsInfo(prevDnsInfo => prevDnsInfo.filter((_, i) => i !== index));
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center'}}>
        <div>
            <h2 style={{ fontFamily: "'Roboto Mono', sans-serif" }}>DNS Reachability and Resolution</h2>
            <div>
                <input
                    type="text"
                    value={hostname}
                    onChange={e => setHostname(e.target.value)}
                    placeholder="Enter hostname"
                />
                <button onClick={fetchDNSInfo}>Check DNS</button>
            </div>
            {error && <p>{error}</p>}
            {dnsInfo.map((record, index) => (
                <div key={index} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', margin: '10px 0' }}>
                    <button style={{ float: 'right' }} onClick={() => deleteRecord(index)}>Delete</button>
                    <h3>Hostname: {record.hostname}</h3>
                    {Object.keys(record.info).map((dnsServer, dnsIndex) => (
                        <div key={dnsIndex}>
                            <h4>DNS Server: {dnsServer}</h4>
                            <p><strong>Hostname:</strong> {record.info[dnsServer].target_domain || record.hostname}</p>
                            <p><strong>DNS Reachable:</strong> {record.info[dnsServer].dns_reachable ? 'Yes' : 'No'}</p>
                            <p><strong>Resolution Successful:</strong> {record.info[dnsServer].resolution_success ? 'Yes' : 'No'}</p>
                            {record.info[dnsServer].resolution_success && (
                                <p><strong>Resolved IPs:</strong> {record.info[dnsServer].resolved_ips.join(', ')}</p>
                            )}
                        </div>
                    ))}
                </div>
            ))}
            </div>
        </div>
    );
};

export default DNSLookup;
