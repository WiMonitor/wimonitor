import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NTPSources.css';

const NTPSources = () => {
    const [sources, setSources] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNTPSources();
    }, []);

    const fetchNTPSources = async () => {
        try {
            const response = await axios.get('http://localhost:5000/ntp_sources');
            setSources(response.data);
            if (response.data.length === 0) {
                setError('No NTP sources found.');
            }
        } catch (error) {
            setError('Failed to fetch NTP sources: ' + error.message);
        }
    };

    return (
        <div>
            <h2>NTP Sources</h2>
            {error ? <p>{error}</p> : sources.length > 0 ? (
                <div className="card-container">
                    {sources.map((source, index) => (
                        <div className="card" key={index}>
                            <h4>{source.remote}</h4>
                            <p><strong>Reference ID:</strong> {source.ref_id}</p>
                            <p><strong>Stratum:</strong> {source.stratum}</p>
                            <p><strong>Type:</strong> {source.type}</p>
                            <p><strong>Time since last poll:</strong> {source.when} seconds</p>
                            <p><strong>Poll interval:</strong> {source.poll} seconds</p>
                            <p><strong>Reachability:</strong> {source.reach}</p>
                            <p><strong>Delay:</strong> {source.delay} ms</p>
                            <p><strong>Offset:</strong> {source.offset} ms</p>
                            <p><strong>Jitter:</strong> {source.jitter} ms</p>
                        </div>
                    ))}
                </div>
            ) : <p>Loading NTP sources...</p>}
        </div>
    );
};

export default NTPSources;
