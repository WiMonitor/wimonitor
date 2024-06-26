import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NTPSources = () => {
    const [sources, setSources] = useState({});
    const [error, setError] = useState('');
    const [cNtpServers, setCNtpServers] = useState([]);
    const [customTestResults, setCustomTestResults] = useState({});
    const [customTestError, setCustomTestError] = useState('');
    const [ntpChanges, setNtpChanges] = useState([]);
    const [ntpChangesError, setNtpChangesError] = useState('');
    
    useEffect(() => {
        const fetchNTPSources = async () => {
            const backendUrl = localStorage.getItem('backendUrl');
            const port = localStorage.getItem('port');

            try {
                if (!backendUrl || !port || backendUrl === '' || port === '') {
                    setError('Please set backend URL and port in the settings.');
                    return;
                }

                // Make a request to the backend
                const response = await axios.get(`http://${backendUrl}:${port}/ntp_sources`);
                setSources(response.data);
                if (Object.keys(response.data).length === 0) {
                    setError('No NTP sources found.');
                }
            } catch (error) {
                setError('Error fetching NTP srouces: ' + error.message);
            }
        try {
            const changesResponse = await axios.get(`http://${backendUrl}:${port}/ntp_changes`);
            setNtpChanges(changesResponse.data.ntp_changes);
        } catch (error) {
            setNtpChangesError('Error fetching NTP changes: ' + error.message);
        }
    };
        fetchNTPSources();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCustomTestResults({});
        try {
            // get backendUrl and port from sessionStorage
            const backendUrl = localStorage.getItem('backendUrl');
            const port = localStorage.getItem('port');
            if (!backendUrl || !port || backendUrl === '' || port === '') {
                setCustomTestError('Please set backend URL and port in the settings.');
                return;
            }

            // make a request to the backend
            const response = await axios.post(`http://${backendUrl}:${port}/ntp_sources`, { ntp_servers: cNtpServers.trim().split('\n') });
            setCustomTestResults(response.data);
            setCustomTestError('');
            if (Object.keys(response.data).length === 0) {
                setCustomTestError('No NTP sources found.');
            }
        } catch (error) {
            setCustomTestError('Error fetching NTP srouces: ' + error.message);
        }
    }

    return (
        <div className='page-container'>
            <div className='ntp-local'>
                <h2 style={{ fontFamily: "'Roboto Mono', sans-serif", textAlign: 'center' }}>Local NTP Status</h2>
                {error && <p>{error}</p>}
                {Object.keys(sources).length > 0 && (
                    <div className="card-container">
                        {Object.keys(sources).map((key) => (
                            <div key={key} className={
                                sources[key] === null ? 'card card-error' : 
                                sources[key].status === 'failed' ? 'card card-warning' : 'card card-success'
                            }>
                                <h3>{key}</h3>
                                {sources[key] === null ? <p>No Response</p> : (
                                    <div>
                                        <p>Status: {sources[key].status}</p>
                                        <p>Offset: {(parseFloat(sources[key].offset) * 1000).toFixed(2)} ms</p>
                                        <p>Stratum: {sources[key].stratum}</p>
                                        <p>Request Sent On: {new Date(sources[key].local_sent_on * 1000).toLocaleTimeString()}</p>
                                        <p>Response Received On: {new Date(sources[key].local_received_on * 1000).toLocaleTimeString()}</p>
                                        <p>Delay: {parseFloat(sources[key].delay).toFixed(2)}s</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className='ntp-custom'>
                <h2 style={{ fontFamily: "'Roboto Mono', sans-serif" }}>Other NTP Servers</h2>
                <form onSubmit={handleSubmit}>
                    <textarea
                        id='ntp-servers'
                        placeholder='Enter 1 NTP server per line.'
                        value={cNtpServers}
                        onChange={(e) => setCNtpServers(e.target.value)}
                        className='form-control'
                    ></textarea>
                    <button type='submit' className='btn btn-success'>Submit</button>
                </form>
                <br />
                {customTestError && <p>{customTestError}</p>}
                {Object.keys(customTestResults).length > 0 && (
                    <div className="card-container-vertical">
                        {Object.keys(customTestResults).map((key) => (
                            <div key={key} className={
                                customTestResults[key] === null ? 'card card-error' : 
                                customTestResults[key].status === 'failed' ? 'card card-warning' : 'card card-success'
                            }>
                                <h3>{key}</h3>
                                {customTestResults[key] === null ? <p>No Response</p> : (
                                    <div>
                                        <p>Status: {customTestResults[key].status}</p>
                                        <p>Offset: {(parseFloat(customTestResults[key].offset) * 1000).toFixed(2)} ms</p>
                                        <p>Stratum: {customTestResults[key].stratum}</p>
                                        <p>Request Sent On: {new Date(customTestResults[key].local_sent_on * 1000).toLocaleTimeString()}</p>
                                        <p>Response Received On: {new Date(customTestResults[key].local_received_on * 1000).toLocaleTimeString()}</p>
                                        <p>Delay: {parseFloat(customTestResults[key].delay).toFixed(2)}s</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className='ntp-changes'>
                <h2 style={{ fontFamily: "'Roboto Mono', sans-serif" }}>NTP Configuration Changes</h2>
                {ntpChangesError && <p>{ntpChangesError}</p>}
                {ntpChanges.length > 0 ? (
                    <ul>
                        {ntpChanges.filter((change, index) => 
                            index === 0 || ntpChanges[index - 1].hash !== change.hash 
                            ).map((change, index) => (
                    <li key={index}>
                        Changed on: {new Date(change.timestamp).toLocaleString()}
                    </li>
            ))}
                    </ul>
                ) : <p>No recent changes.</p>}
            </div>
        </div>
    );
};

export default NTPSources;

