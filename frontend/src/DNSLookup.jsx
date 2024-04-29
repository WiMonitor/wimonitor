import React, { useState } from 'react';
import axios from 'axios';

const DNSLookup = () => {
    const [hostname, setHostname] = useState('google.com');
    const [dnsInfo, setDnsInfo] = useState(null);
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
            setDnsInfo(response.data);
            setError('');
        } catch (error) {
            console.error('Failed to fetch DNS information:', error);
            setError('Failed to fetch DNS information: ' + error.message);
            setDnsInfo(null);
        }
    };

    return (
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
            {error ? <p>{error}</p> : dnsInfo && (
                <div>
                    {Object.keys(dnsInfo).map((dnsServer, index) => (
                        <div key={index}>
                            <h3>DNS Server: {dnsServer}</h3>
                            <p><strong>Hostname:</strong> {dnsInfo[dnsServer].target_domain || hostname}</p>
                            <p><strong>DNS Reachable:</strong> {dnsInfo[dnsServer].dns_reachable ? 'Yes' : 'No'}</p>
                            <p><strong>Resolution Successful:</strong> {dnsInfo[dnsServer].resolution_success ? 'Yes' : 'No'}</p>
                            {dnsInfo[dnsServer].resolution_success && (
                                <p><strong>Resolved IPs:</strong> {dnsInfo[dnsServer].resolved_ips.join(', ')}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DNSLookup;
