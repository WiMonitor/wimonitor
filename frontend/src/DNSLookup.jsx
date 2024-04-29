import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DNSLookup = () => {
    const [hostname, setHostname] = useState('');
    const [dnsInfo, setDnsInfo] = useState([]);
    const [error, setError] = useState('');
    const [localDnsServer, setLocalDnsServer] = useState([]);
    const [dnsToCheck, setDnsToCheck] = useState('');

    const fetchDNSInfo = async () => {
        if (!hostname || hostname.trim() === '' || !dnsToCheck || dnsToCheck.trim() === ''){
            alert('Please complete both fields before submitting.');
            return;
        }

        const backendUrl = localStorage.getItem('backendUrl') || 'localhost';
        const port = localStorage.getItem('port') || '3000';        
        try {
            const response = await axios.post(`http://${backendUrl}:${port}/dns_check`, 
            { test_domain: hostname.trim(), dns_servers: dnsToCheck.split(',').map(dns => dns.trim())}
            );
            const newDnsRecord = { hostname, info: response.data };
            setDnsInfo(prevDnsInfo => [newDnsRecord, ...prevDnsInfo]);
            setError('');
        } catch (error) {
            console.error('Failed to fetch DNS information:', error);
            setError('Failed to fetch DNS information: ' + error.message);
        }
    };

    useEffect(() => {
        const backendUrl = localStorage.getItem('backendUrl');
        const port = localStorage.getItem('port');
        if (!backendUrl || !port || backendUrl === '' || port === '') {
            setError('Pleause set backend URL and port in the settings.');
            return;
        }

        axios.get(`http://${backendUrl}:${port}/local_dns_config`)
            .then(response => {
                setLocalDnsServer(response.data);
                setDnsToCheck(response.data.toString());
            })
            .catch(error => {
                console.error('Failed to fetch local DNS config:', error);
                setError('Failed to fetch local DNS config: ' + error.message);
            });
    }, []);


    const deleteRecord = (index) => {
        setDnsInfo(prevDnsInfo => prevDnsInfo.filter((_, i) => i !== index));
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center'}}>
        <div>
            <h2 style={{ fontFamily: "'Roboto Mono', sans-serif" }}>DNS Reachability and Resolution</h2>
            <div>
                <p>Local DNS Servers: {localDnsServer}</p>
                <i>DNS Servers: (Separate with commas)</i>
                <input
                    type="text"
                    value={dnsToCheck}
                    onChange={e => setDnsToCheck(e.target.value)}
                    placeholder="DNS Server, separate with commas"
                    className="form-control"
                />
                <i>Hostname: (One at a time)</i>
                <input
                    type="text"
                    value={hostname}
                    onChange={e => setHostname(e.target.value)}
                    placeholder="Enter hostname"
                    className="form-control" 
                />
                <button onClick={fetchDNSInfo} className='btn btn-success'>Check</button>
            </div>
            {error && <p>{error}</p>}
            {dnsInfo.map((record, index) => (
                <div key={index} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', margin: '10px 0' }}>
                    <button style={{ float: 'right' }} className='btn btn-danger' onClick={() => deleteRecord(index)}>Delete</button>
                    <h2>{record.hostname}</h2>
                    {Object.keys(record.info).map((dnsServer, dnsIndex) => (
                        <div key={dnsIndex}>
                            <h5><strong>DNS Server: {dnsServer}</strong></h5>
                            <p><strong>DNS Reachable:</strong> {record.info[dnsServer].dns_reachable ? 'Yes' : 'No'}</p>
                            <p><strong>Resolution Successful:</strong> {record.info[dnsServer].resolution_success ? 'Yes' : 'No'}</p>
                            {record.info[dnsServer].resolution_success && (
                                <p><strong>Resolved IPs:</strong> {record.info[dnsServer].resolved_ips.join(', ')}</p>
                            )}
                           {dnsIndex < Object.keys(record.info).length - 1 && <hr />}
                        </div>
                    ))}
                </div>
            ))}
            </div>
        </div>
    );
};

export default DNSLookup;
