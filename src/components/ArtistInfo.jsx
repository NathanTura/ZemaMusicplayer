import React, { useState, useEffect } from 'react';

import usePlayerStore from '../store/usePlayerStore';

const ArtistInfo = ({ currentTrack, onArtistImageLoaded }) => {
  const { preloadedArtistInfo: info, preloadedArtistError: error } = usePlayerStore();

  useEffect(() => {
    if (onArtistImageLoaded) {
      onArtistImageLoaded(info?.image || null);
    }
  }, [info, onArtistImageLoaded]);

  if (!info && !error && currentTrack?.artist) {
    return <div className="artist-info-container loading"><div className="loader-spinner"></div></div>;
  }

  if (error || !info) {
    return (
      <div className="artist-info-container error">
        <span className="material-symbols-rounded">person_off</span>
        <p>No additional online info available.</p>
      </div>
    );
  }

  return (
    <div className="artist-info-container">
      <div className="artist-header">
        {info.image ? (
          <img src={info.image} alt={info.name} className="artist-avatar" />
        ) : (
          <div className="artist-avatar placeholder">
            <span className="material-symbols-rounded">person</span>
          </div>
        )}
        <h3>{info.name}</h3>
      </div>
      <div className="artist-bio">
        <p>{info.description}</p>
        {info.url && (
          <a href={info.url} target="_blank" rel="noopener noreferrer" className="artist-link">
            Read more <span className="material-symbols-rounded" style={{fontSize: '1rem'}}>open_in_new</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ArtistInfo;
