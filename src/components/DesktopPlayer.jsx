import React from 'react';

const DesktopPlayer = () => (
  <footer className="desktop-player desktop-only">
    <div className="player-container">
      <div className="player-controls">
        <button className="icon-btn"><span className="material-symbols-rounded">shuffle</span></button>
        <button className="icon-btn"><span className="material-symbols-rounded">skip_previous</span></button>
        <button className="play-btn"><span className="material-symbols-rounded">play_arrow</span></button>
        <button className="icon-btn"><span className="material-symbols-rounded">skip_next</span></button>
        <button className="icon-btn"><span className="material-symbols-rounded">repeat</span></button>
      </div>
      
      <div className="player-progress">
        <span className="time-current">0:00</span>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '0%' }}></div>
          </div>
        </div>
        <span className="time-total">0:00</span>
      </div>

      <div className="player-track-info">
        <div className="track-art empty-track-art">
           <span className="material-symbols-rounded">music_note</span>
        </div>
        <div className="track-text">
          <div className="track-title">No track selected</div>
          <div className="track-artist">Unknown Artist</div>
        </div>
      </div>

      <div className="player-options">
        <button className="icon-btn"><span className="material-symbols-rounded">volume_up</span></button>
        <div className="volume-slider">
           <div className="volume-fill" style={{ width: '80%' }}></div>
        </div>
      </div>
    </div>
  </footer>
);

export default DesktopPlayer;
