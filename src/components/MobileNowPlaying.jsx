import React from 'react';

const MobileNowPlaying = ({ isOpen, onToggle }) => (
  <div className={`mobile-now-playing mobile-only ${isOpen ? 'open' : ''}`}>
    <header className="now-playing-header">
       <button className="icon-btn" onClick={onToggle}><span className="material-symbols-rounded">keyboard_arrow_down</span></button>
       <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Now Playing</span>
       <button className="icon-btn"><span className="material-symbols-rounded">more_vert</span></button>
    </header>
    
    <div className="now-playing-main">
       <div className="big-artwork-container">
          <div className="huge-artwork empty-track-art">
             <span className="material-symbols-rounded" style={{ fontSize: '5rem' }}>music_note</span>
          </div>
       </div>

       <div className="track-info-large">
         <div style={{ flex: 1 }}>
           <div className="track-title-large">No track selected</div>
           <div className="track-artist-large">Unknown Artist</div>
         </div>
         <button className="icon-btn like-btn"><span className="material-symbols-rounded" style={{ fontSize: '2rem' }}>favorite</span></button>
       </div>

       <div className="now-playing-progress">
         <div className="progress-bar-container">
            <div className="progress-bar">
               <div className="progress-fill" style={{ width: '0%' }}></div>
            </div>
         </div>
         <div className="time-row">
            <span className="time">0:00</span>
            <span className="time">0:00</span>
         </div>
       </div>

       <div className="huge-controls">
          <button className="icon-btn"><span className="material-symbols-rounded">shuffle</span></button>
          <button className="huge-icon-btn"><span className="material-symbols-rounded">skip_previous</span></button>
          <button className="huge-play-btn"><span className="material-symbols-rounded">play_arrow</span></button>
          <button className="huge-icon-btn"><span className="material-symbols-rounded">skip_next</span></button>
          <button className="icon-btn"><span className="material-symbols-rounded">repeat</span></button>
       </div>
    </div>
    
    <footer className="now-playing-footer">
       <button className="action-btn"><span className="material-symbols-rounded">queue_music</span></button>
       <button className="action-btn"><span className="material-symbols-rounded">equalizer</span></button>
    </footer>
  </div>
);

export default MobileNowPlaying;
