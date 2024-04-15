import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NTPSources = () => {
    const [sources, setSources] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNTPSources();
    }, []);

    const fetchNTPSources = async () => {
        try {
            console.log("Fetching NTP sources...");
            const response = await axios.get('http://localhost:5000/ntp_sources');
            console.log("Response data:", response.data); 
            setSources(response.data);
            if (response.data.length === 0) {
                setError('No NTP sources found.');
            }
        } catch (error) {
            console.error("Error fetching NTP sources:", error);
            setError('Failed to fetch NTP sources: ' + error.message);
        }
    };

    return (
        <div>
            <h2>NTP Sources</h2>
            {error ? <p>{error}</p> : sources.length > 0 ? (
                <ul>
                    {sources.map((source, index) => (
                        <li key={index}>
                            <strong>Remote:</strong> {source.remote} <br />
                            <strong>Reference ID:</strong> {source.ref_id} - type of time source <br />
                            <strong>Stratum:</strong> {source.stratum}  <br />
                            <strong>Type:</strong> {source.type} - connection type to the server <br />
                            <strong>Time since last poll:</strong> {source.when} seconds - time since last successful synchronization <br />
                            <strong>Poll interval:</strong> {source.poll} seconds - frequency of synchronization attempts <br />
                            <strong>Reachability:</strong> {source.reach} - success or failure of recent synchronization attempts <br />
                            <strong>Delay:</strong> {source.delay} ms - round-trip time to the server <br />
                            <strong>Offset:</strong> {source.offset} ms - difference in time between your server and the NTP server <br />
                            <strong>Jitter:</strong> {source.jitter} ms - variation in response time over recent polls
                        </li>
                    ))}
                </ul>
            ) : <p>Loading NTP sources...</p>}
        </div>
    );
};

export default NTPSources;