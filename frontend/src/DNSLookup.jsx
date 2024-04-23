import React, { useState } from 'react';
import axios from 'axios';

const DNSLookup = () => {
    const [hostname, setHostname] = useState('google.com');
    const [dnsServer, setDnsServer] = useState('8.8.8.8');
    const [dnsInfo, setDnsInfo] = useState(null);
    const [error, setError] = useState('');

    const fetchDNSInfo = async () => {
        try {
            const backendUrl = localStorage.getItem('backendUrl');
            const port = localStorage.getItem('port');
            if (!backendUrl || !port || backendUrl === '' || port === '') {
                setError('Please set backend URL and port in the settings.');
                return;
            }
            const response = await axios.get(`http://${backendUrl}:${port}/dns_check`, {
                params: {
                    hostname: hostname,
                    dns_server: dnsServer
                }
            });
            setDnsInfo(response.data);
        } catch (error) {
            setError('Failed to fetch DNS information: ' + error.message);
        }
    };

    return (
        <div>
            <h2>DNS Reachability and Resolution</h2>
            <div>
                <input type="text" value={hostname} onChange={e => setHostname(e.target.value)} placeholder="Enter hostname" />
                <input type="text" value={dnsServer} onChange={e => setDnsServer(e.target.value)} placeholder="Enter DNS server" />
                <button onClick={fetchDNSInfo}>Check DNS</button>
            </div>
            {error ? <p>{error}</p> : dnsInfo && (
                <div>
                    <p><strong>DNS Server:</strong> {dnsInfo.dns_server}</p>
                    <p><strong>DNS Reachable:</strong> {dnsInfo.dns_reachable ? 'Yes' : 'No'}</p>
                    <p><strong>Hostname:</strong> {dnsInfo.hostname}</p>
                    <p><strong>Resolution Successful:</strong> {dnsInfo.resolution_success ? 'Yes' : 'No'}</p>
                    {dnsInfo.resolution_success && <p><strong>Resolved IP:</strong> {dnsInfo.resolved_ip}</p>}
                    {dnsInfo.dns_error && <p><strong>DNS Error:</strong> {dnsInfo.dns_error}</p>}
                    {dnsInfo.resolution_error && <p><strong>Resolution Error:</strong> {dnsInfo.resolution_error}</p>}
                </div>
            )}
        </div>
    );
};

export default DNSLookup;
