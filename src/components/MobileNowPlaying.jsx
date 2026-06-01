import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const MobileNowPlaying = ({ isOpen, onToggle }) => {
  const [showQueue, setShowQueue] = useState(false);

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    likes,
    toggleLike,
    isShuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    queue,
    currentIndex,
    playTrack,
  } = usePlayerStore();

  const percentComplete = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentTrack && likes.some(t => t.id === currentTrack.id);

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onToggle();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mobile-now-playing mobile-only open"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 1 }}
          onDragEnd={handleDragEnd}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <header className="now-playing-header">
            <button className="icon-btn" onClick={onToggle}>
              <span className="material-symbols-rounded">keyboard_arrow_down</span>
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, textAlign: 'center', marginRight: '48px' }}>
              {showQueue ? 'Queue' : 'Now Playing'}
            </span>
          </header>

          <div className="now-playing-main" style={{ overflowY: showQueue ? 'auto' : 'visible' }}>
            {showQueue ? (
              <div className="mobile-queue" style={{ flex: 1, paddingBottom: '24px' }}>
                <div className="queue-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Up Next</h3>
                  <button
                    className="icon-btn"
                    onClick={() => usePlayerStore.setState({ queue: [] })}
                    title="Clear queue"
                  >
                    <span className="material-symbols-rounded">delete_sweep</span>
                  </button>
                </div>

                {queue.length === 0 ? (
                  <div className="empty-queue" style={{ textAlign: 'center', marginTop: '40px', color: 'var(--color-text-muted)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '3rem', opacity: 0.4 }}>queue_music</span>
                    <p style={{ color: 'var(--color-text)', fontWeight: 600, marginTop: '8px' }}>Queue is empty</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Play a track to get started</p>
                  </div>
                ) : (
                  <div className="track-list">
                    {queue.map((track, idx) => (
                      <div
                        key={track.id + '-' + idx}
                        className={`track-item ${idx === currentIndex ? 'playing' : ''}`}
                        onClick={() => playTrack(track, queue)}
                      >
                        <div className="track-number">
                          {idx === currentIndex
                            ? <span className="material-symbols-rounded" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>volume_up</span>
                            : idx + 1}
                        </div>
                        <div className="track-icon" style={{ flexShrink: 0 }}>
                          {track.coverArt
                            ? <img src={track.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                            : <span className="material-symbols-rounded">music_note</span>}
                        </div>
                        <div className="track-info">
                          <div className="track-name">{track.title}</div>
                          <div className="track-artist">{track.artist}</div>
                        </div>
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newQueue = [...queue];
                            newQueue.splice(idx, 1);
                            usePlayerStore.setState({ queue: newQueue });
                          }}
                          title="Remove"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="big-artwork-container">
                  <div className={`huge-artwork ${currentTrack?.coverArt ? '' : 'empty-track-art'}`}>
                    {currentTrack?.coverArt ? (
                      <img
                        src={currentTrack.coverArt}
                        alt="Cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                      />
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: '5rem' }}>music_note</span>
                    )}
                  </div>
                </div>

                <div className="track-info-large">
                  <div style={{ flex: 1 }}>
                    <div className="track-title-large">{currentTrack ? currentTrack.title : 'No track selected'}</div>
                    <div className="track-artist-large">{currentTrack ? currentTrack.artist : 'Unknown Artist'}</div>
                  </div>
                  <button
                    className={`icon-btn like-btn ${isLiked ? 'active' : ''}`}
                    onClick={() => currentTrack && toggleLike(currentTrack)}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '2rem' }}>
                      {isLiked ? 'favorite' : 'favorite_border'}
                    </span>
                  </button>
                </div>

                <div className="now-playing-progress">
                  <input
                    type="range"
                    className="custom-slider"
                    min={0}
                    max={duration || 100}
                    value={progress || 0}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, var(--color-primary) ${percentComplete}%, rgba(255,255,255,0.2) ${percentComplete}%)`,
                      marginBottom: '8px'
                    }}
                  />
                  <div className="time-row">
                    <span className="time">{formatTime(progress)}</span>
                    <span className="time">{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="huge-controls">
                  <button
                    className={`icon-btn ${isShuffle ? 'active' : ''}`}
                    onClick={toggleShuffle}
                    style={{ color: isShuffle ? 'var(--color-primary)' : '' }}
                  >
                    <span className="material-symbols-rounded">shuffle</span>
                  </button>
                  <button className="huge-icon-btn" onClick={prevTrack}>
                    <span className="material-symbols-rounded">skip_previous</span>
                  </button>
                  <button className="huge-play-btn" onClick={togglePlay}>
                    <span className="material-symbols-rounded">{isPlaying ? 'pause' : 'play_arrow'}</span>
                  </button>
                  <button className="huge-icon-btn" onClick={nextTrack}>
                    <span className="material-symbols-rounded">skip_next</span>
                  </button>
                  <button
                    className={`icon-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                    onClick={cycleRepeat}
                    style={{ color: repeatMode !== 'off' ? 'var(--color-primary)' : '' }}
                  >
                    <span className="material-symbols-rounded">
                      {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <footer className="now-playing-footer">
            <button
              className="action-btn"
              onClick={() => setShowQueue(!showQueue)}
              style={{ color: showQueue ? 'var(--color-primary)' : '' }}
            >
              <span className="material-symbols-rounded">queue_music</span>
            </button>
            <button className="action-btn">
              <span className="material-symbols-rounded">equalizer</span>
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNowPlaying;
