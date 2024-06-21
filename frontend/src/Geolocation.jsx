import React, { useState, useEffect } from 'react';

const Geolocation = ({ onLocationFetch }) => {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [error, setError] = useState('');

    const handleSuccess = (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        onLocationFetch({ latitude, longitude });  // Propagate location data up or send to server here
    };

    const handleError = (error) => {
        setError(error.message);
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
        } else {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true });
        }
    }, [onLocationFetch]);

    return (
        <div>
            {error ? (
                <p>Error: {error}</p>
            ) : (
                <p>Latitude: {location.latitude}, Longitude: {location.longitude}</p>
            )}
        </div>
    );
};

export default Geolocation;
