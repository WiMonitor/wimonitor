import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NTPSources = () => {
    const [sources, setSources] = useState({});
    const [error, setError] = useState('');
    const [cNtpServers, setCNtpServers] = useState([]);
    
    useEffect(() => {
        const fetchNTPSources = async () => {
            try {
                // get backendUrl and port from sessionStorage
                const backendUrl = localStorage.getItem('backendUrl');
                const port = localStorage.getItem('port');
                if (!backendUrl || !port || backendUrl === '' || port === '') {
                    setError('Please set backend URL and port in the settings.');
                    return;
                }

                // make a request to the backend
                const response = await axios.get(`http://${backendUrl}:${port}/ntp_sources`);
                setSources(response.data);
                if (Object.keys(response.data).length === 0) {
                    setError('No NTP sources found.');
                }
            } catch (error) {
                setError('Error fetching NTP srouces: ' + error.message);
            }
        };

        fetchNTPSources();
    }, []);

    if (error) {
        return (
            <div>
                <h2>NTP Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className='page-container'>
        <div className='ntp-local'>
            <h2>Local NTP Status</h2>
            
            {Object.keys(sources).length > 0 ? (
                <div className="card-container">
                    {Object.keys(sources).map((key) => (
                        <div key={key} className={
                            sources[key] === null ? 'card card-error' : 
                            sources[key].status === 'failed' ? 'card card-warning' : 'card card-success'
                        }>
                            <h3>{key}</h3>
                            {sources[key] === null ? <p>No Response</p>:(
                                <div>
                                    <p>Status: {sources[key].status}</p>
                                    <p>Offset: {(parseFloat(sources[key].offset)*1000).toFixed(2)} ms</p>
                                    <p>Stratum: {sources[key].stratum}</p>
                                    <p>Request Sent On: {new Date(parseInt(sources[key].local_sent_on)*1000).toLocaleTimeString()}</p>
                                    <p>Response Received On: {new Date(parseInt(sources[key].local_received_on)*1000).toLocaleTimeString()}</p>
                                    <p>Delay: {parseFloat(sources[key].delay).toFixed(2)}s</p>
                                </div>
                            )
                            }
                        </div>
                            
                    ))}
                </div>
            ) : <p>Loading Local NTP Sources</p>}
        </div>
        <div className='ntp-custom'>
            <h2>Other NTP Servers</h2>
        </div>

        </div>
    );
};

export default NTPSources;
