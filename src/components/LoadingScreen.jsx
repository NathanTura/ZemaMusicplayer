import React from 'react';

const LoadingScreen = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div id="loading-screen" style={{ opacity: 1 }}>
      <div style={{ position: 'relative' }}>
        <img src="/logo.png" alt="Zema Loading Logo" className="loading-logo" />
      </div>
    </div>
  );
};

export default LoadingScreen;
