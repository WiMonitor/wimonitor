import React from 'react';

function SpeedTest() {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ minHeight: '360px' }}>
        <div style={{ width: '100%', height: '0', paddingBottom: '50%', position: 'relative' }}>
          <iframe
            style={{
              border: 'none',
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              minHeight: '360px',
              overflow: 'hidden'
            }}
            src="//openspeedtest.com/speedtest"
            allowFullScreen
            title='speedtest'
          />
        </div>
      </div>
    </div>
  );
}

export default SpeedTest;