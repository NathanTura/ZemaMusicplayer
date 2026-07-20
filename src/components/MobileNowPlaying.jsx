import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';
import SyncedLyrics from './SyncedLyrics';

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// panels in left-to-right swipe order
const PANELS = ['queue', 'player', 'lyrics'];

const MobileNowPlaying = ({ isOpen, onToggle, setCurrentView }) => {
  const [activePanel, setActivePanel] = useState('player');
  const [bgColor, setBgColor] = useState('rgb(30,30,30)');
  const dragStartX = useRef(null);

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
    setPlaylistModalTrack,
    artists,
    setSelectedArtist
  } = usePlayerStore();

  // Extract dominant color from album art
  useEffect(() => {
    if (!currentTrack?.coverArt) { setBgColor('rgb(30,30,30)'); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.coverArt;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setBgColor(`rgb(${Math.floor(r * 0.55)},${Math.floor(g * 0.55)},${Math.floor(b * 0.55)})`);
      } catch { setBgColor('rgb(30,30,30)'); }
    };
    img.onerror = () => setBgColor('rgb(30,30,30)');
  }, [currentTrack?.coverArt]);

  const percentComplete = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentTrack && likes.some(t => t.id === currentTrack.id);

  // Swipe to navigate between panels
  const handleTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (dragStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 50) return; // ignore small movements
    const idx = PANELS.indexOf(activePanel);
    if (dx < 0 && idx < PANELS.length - 1) setActivePanel(PANELS[idx + 1]); // swipe left → next
    if (dx > 0 && idx > 0) setActivePanel(PANELS[idx - 1]);                  // swipe right → prev
  };

  // Drag sheet down to dismiss
  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onToggle();
  };

  const headerLabel = { queue: 'Queue', lyrics: 'Lyrics', player: 'Now Playing' }[activePanel];

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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ── Header ── */}
          <header className="now-playing-header">
            {activePanel !== 'player' ? (
              <button className="icon-btn" onClick={() => setActivePanel('player')}>
                <span className="material-symbols-rounded">arrow_back</span>
              </button>
            ) : (
              <button className="icon-btn" onClick={onToggle}>
                <span className="material-symbols-rounded">keyboard_arrow_down</span>
              </button>
            )}
            <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, textAlign: 'center', marginRight: '48px' }}>
              {headerLabel}
            </span>
          </header>

          {/* ── Swipe dots indicator ── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingBottom: '6px' }}>
            {PANELS.map(p => (
              <div
                key={p}
                onClick={() => setActivePanel(p)}
                style={{
                  width: activePanel === p ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: activePanel === p ? 'var(--color-primary)' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* ── Body ── */}
          <div
            className="now-playing-main"
            style={{ overflowY: activePanel !== 'player' ? 'auto' : 'visible', overflowX: 'hidden' }}
          >

            {/* ── Queue panel ── */}
            {activePanel === 'queue' && (
              <div className="mobile-queue" style={{ flex: 1, paddingBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Up Next</h3>
                  <button className="icon-btn" onClick={() => usePlayerStore.setState({ queue: [] })} title="Clear queue">
                    <span className="material-symbols-rounded">delete_sweep</span>
                  </button>
                </div>
                {queue.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--color-text-muted)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '3rem', opacity: 0.4 }}>queue_music</span>
                    <p style={{ fontWeight: 600, marginTop: '8px' }}>Queue is empty</p>
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
                            const nq = [...queue];
                            nq.splice(idx, 1);
                            usePlayerStore.setState({ queue: nq });
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Lyrics panel ── */}
            {activePanel === 'lyrics' && (
              <div style={{ flex: 1, overflowX: 'hidden', paddingBottom: '24px' }}>
                {/* Mini track header – desktop-style with dynamic bg */}
                <div className="mobile-lyrics-header" style={{ background: `linear-gradient(160deg, ${bgColor} 0%, #000 100%)` }}>
                  <div className="mobile-lyrics-cover">
                    {currentTrack?.coverArt
                      ? <img src={currentTrack.coverArt} alt="Cover" />
                      : <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#666' }}>music_note</span>}
                  </div>
                  <div className="mobile-lyrics-meta">
                    <span className="mobile-lyrics-title">{currentTrack?.title || 'No track'}</span>
                    <span className="mobile-lyrics-artist">{currentTrack?.artist || 'Unknown Artist'}</span>
                  </div>
                </div>
                {/* The lyrics list */}
                <SyncedLyrics currentTrack={currentTrack} mobile />
              </div>
            )}

            {/* ── Player panel ── */}
            {activePanel === 'player' && (
              <>
                <div className="big-artwork-container">
                  <div className={`huge-artwork ${currentTrack?.coverArt ? '' : 'empty-track-art'}`}>
                    {currentTrack?.coverArt
                      ? <img src={currentTrack.coverArt} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                      : <span className="material-symbols-rounded" style={{ fontSize: '5rem' }}>music_note</span>}
                  </div>
                </div>

                {/* Track info + playlist + like */}
                <div className="track-info-large">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="track-title-large">{currentTrack ? currentTrack.title : 'No track selected'}</div>
                    <div className="track-artist-large"
                         onClick={(e) => {
                           e.stopPropagation();
                           if (currentTrack?.artist && currentTrack.artist !== 'Unknown Artist') {
                             const artistObj = artists?.find(a => a.name === currentTrack.artist);
                             if (artistObj) {
                               setSelectedArtist(artistObj);
                               onToggle(); // Close mobile player
                               if (setCurrentView) setCurrentView('ArtistDetails');
                             }
                           }
                         }}
                         style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                      {currentTrack ? currentTrack.artist : 'Unknown Artist'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button className="icon-btn" onClick={() => currentTrack && setPlaylistModalTrack(currentTrack)} title="Add to Playlist">
                      <span className="material-symbols-rounded" style={{ fontSize: '1.8rem' }}>playlist_add</span>
                    </button>
                    <button className={`icon-btn like-btn ${isLiked ? 'active' : ''}`} onClick={() => currentTrack && toggleLike(currentTrack)}>
                      <span className="material-symbols-rounded" style={{ fontSize: '2rem' }}>
                        {isLiked ? 'favorite' : 'favorite_border'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="now-playing-progress">
                  <input
                    type="range"
                    className="custom-slider"
                    min={0}
                    max={duration || 100}
                    value={progress || 0}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    style={{ background: `linear-gradient(to right, var(--color-primary) ${percentComplete}%, rgba(255,255,255,0.2) ${percentComplete}%)`, marginBottom: '8px' }}
                  />
                  <div className="time-row">
                    <span className="time">{formatTime(progress)}</span>
                    <span className="time">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="huge-controls">
                  <button className={`icon-btn ${isShuffle ? 'active' : ''}`} onClick={toggleShuffle} style={{ color: isShuffle ? 'var(--color-primary)' : '' }}>
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
                  <button className={`icon-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={cycleRepeat} style={{ color: repeatMode !== 'off' ? 'var(--color-primary)' : '' }}>
                    <span className="material-symbols-rounded">{repeatMode === 'one' ? 'repeat_one' : 'repeat'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Footer: Queue + Lyrics ── */}
          <footer className="now-playing-footer">
            <button
              className="action-btn"
              onClick={() => setActivePanel(activePanel === 'queue' ? 'player' : 'queue')}
              style={{ color: activePanel === 'queue' ? 'var(--color-primary)' : '' }}
            >
              <span className="material-symbols-rounded">queue_music</span>
            </button>
            <button
              className="action-btn"
              onClick={() => setActivePanel(activePanel === 'lyrics' ? 'player' : 'lyrics')}
              style={{ color: activePanel === 'lyrics' ? 'var(--color-primary)' : '' }}
            >
              <span className="material-symbols-rounded">lyrics</span>
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNowPlaying;
