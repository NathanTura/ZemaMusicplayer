import React, { useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DesktopPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    likes,
    toggleLike,
    isShuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    setPlaylistModalTrack
  } = usePlayerStore();

  const percentComplete = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentTrack && likes.some(t => t.id === currentTrack.id);

  return (
    <footer className="desktop-player desktop-only">
      <div className="player-container">
        <div className="player-left">
          <div className="player-track-info">
            <div className={`track-art ${currentTrack?.coverArt ? '' : 'empty-track-art'}`}>
               {currentTrack?.coverArt ? (
                 <img src={currentTrack.coverArt} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
               ) : (
                 <span className="material-symbols-rounded">music_note</span>
               )}
            </div>
            <div className="track-text">
              <div className="track-title">{currentTrack ? currentTrack.title : 'No track selected'}</div>
              <div className="track-artist">{currentTrack ? currentTrack.artist : 'Unknown Artist'}</div>
            </div>
            <button className={`icon-btn like-btn ${isLiked ? 'active' : ''}`} onClick={() => currentTrack && toggleLike(currentTrack)}>
              <span className="material-symbols-rounded">{isLiked ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
        </div>
        
        <div className="player-center">
          <div className="player-controls">
            <button className={`icon-btn control-btn ${isShuffle ? 'active' : ''}`} onClick={toggleShuffle} style={{ color: isShuffle ? 'var(--color-primary)' : '' }}>
              <span className="material-symbols-rounded">shuffle</span>
            </button>
            <button className="icon-btn control-btn" onClick={prevTrack}><span className="material-symbols-rounded">skip_previous</span></button>
            <button className="play-btn" onClick={togglePlay}>
              <span className="material-symbols-rounded">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button className="icon-btn control-btn" onClick={nextTrack}><span className="material-symbols-rounded">skip_next</span></button>
            <button className={`icon-btn control-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={cycleRepeat} style={{ color: repeatMode !== 'off' ? 'var(--color-primary)' : '' }}>
              <span className="material-symbols-rounded">{repeatMode === 'one' ? 'repeat_one' : 'repeat'}</span>
            </button>
          </div>
          
          <div className="player-progress">
            <span className="time-current">{formatTime(progress)}</span>
            <input 
              type="range" 
              className="custom-slider" 
              min={0} 
              max={duration || 100} 
              value={progress || 0} 
              onChange={(e) => seek(parseFloat(e.target.value))}
              style={{ background: `linear-gradient(to right, #fff ${percentComplete}%, #4d4d4d ${percentComplete}%)` }}
            />
            <span className="time-total">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <div className="player-options">
            <div className="volume-container" style={{ display: 'flex', alignItems: 'center', width: '130px', gap: '8px' }}>
              <button className="icon-btn control-btn" onClick={() => setVolume(volume === 0 ? 1 : 0)} style={{ padding: 0 }}>
                <span className="material-symbols-rounded">{volume === 0 ? 'volume_off' : 'volume_up'}</span>
              </button>
              <input 
                type="range" 
                className="custom-slider" 
                min={0} 
                max={1} 
                step={0.01}
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ background: `linear-gradient(to right, #fff ${volume * 100}%, #4d4d4d ${volume * 100}%)`, width: '80px' }}
              />
              <button 
                className="icon-btn" 
                title={currentTrack ? `Add "${currentTrack.title}" to playlist` : 'No track selected'}
                onClick={() => currentTrack && setPlaylistModalTrack(currentTrack)}
                style={{ marginLeft: '6px' }}
              >
                <span className="material-symbols-rounded">playlist_add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopPlayer;
