import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const MobileMiniPlayer = ({ onToggle }) => {
  const { currentTrack, isPlaying, progress, duration, togglePlay, likes, toggleLike } = usePlayerStore();
  
  const percentComplete = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentTrack && likes.some(t => t.id === currentTrack.id);

  return (
    <div className="mini-player mobile-only" onClick={onToggle}>
      <div className="mini-progress">
        <div className="mini-progress-fill" style={{ width: `${percentComplete}%` }}></div>
      </div>
      <div className="mini-content">
        <div className={`mini-art ${currentTrack?.coverArt ? '' : 'empty-track-art'}`}>
           {currentTrack?.coverArt ? (
             <img src={currentTrack.coverArt} alt="Cover" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
           ) : (
             <span className="material-symbols-rounded" style={{ fontSize: '1.5rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>music_note</span>
           )}
           <button 
             className="mini-play-btn" 
             onClick={(e) => {
               e.stopPropagation();
               togglePlay();
             }}
             style={{ position: 'relative', zIndex: 2 }}
           >
             <span className="material-symbols-rounded">{isPlaying ? 'pause' : 'play_arrow'}</span>
           </button>
        </div>
        <div className="mini-text">
          <span className="mini-title">{currentTrack ? currentTrack.title : 'No track selected'}</span>
          <span className="mini-artist">{currentTrack ? currentTrack.artist : 'Unknown Artist'}</span>
        </div>
        <button 
          className={`icon-btn like-btn ${isLiked ? 'active' : ''}`} 
          onClick={(e) => {
             e.stopPropagation();
             if (currentTrack) toggleLike(currentTrack);
          }}
        >
          <span className="material-symbols-rounded">{isLiked ? 'favorite' : 'favorite_border'}</span>
        </button>
      </div>
    </div>
  );
};

export default MobileMiniPlayer;
