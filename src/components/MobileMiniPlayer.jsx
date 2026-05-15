import React from 'react';

const MobileMiniPlayer = ({ onToggle }) => (
  <div className="mini-player mobile-only" onClick={onToggle}>
    <div className="mini-progress">
      <div className="mini-progress-fill" style={{ width: '0%' }}></div>
    </div>
    <div className="mini-content">
      <div className="mini-art empty-track-art">
         <button className="mini-play-btn" onClick={(e) => e.stopPropagation()}>
           <span className="material-symbols-rounded">play_arrow</span>
         </button>
      </div>
      <div className="mini-text">
        <span className="mini-title">No track selected</span>
        <span className="mini-artist">Unknown Artist</span>
      </div>
    </div>
  </div>
);

export default MobileMiniPlayer;
