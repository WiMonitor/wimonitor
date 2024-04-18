import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NTPSources = () => {
    const [sources, setSources] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNTPSources = async () => {
            try {
                const response = await axios.get('http://localhost:5000/ntp_sources');
                setSources(response.data);
                if (Object.keys(response.data).length === 0) {
                    setError('No NTP sources found.');
                }
            } catch (error) {
                setError('Failed to fetch NTP sources: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNTPSources();
    }, []); // Empty dependency array for component mount only

    if (loading) {
        return <p>Loading NTP sources...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h2>NTP Sources</h2>
            
            {Object.keys(sources).length > 0 ? (
                <div className="card-container">
                    {Object.keys(sources).map((key) => (
                        <div key={key} className="card">
                            <h3>{key}</h3>
                            <p>Status: {sources[key].status}</p>
                            <p>Offset: {(parseFloat(sources[key].offset)*1000).toFixed(2)} ms</p>
                            <p>Request Sent On: {new Date(sources[key].local_sent_on).toLocaleTimeString()}</p>
                            <p>Response Received On: {new Date(parseInt(1713464655)).toLocaleTimeString()}</p>
                            </div>
                    ))}
                </div>
            ) : <p>No sources to display.</p>}
        </div>
    );
};

export default NTPSources;
