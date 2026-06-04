import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';
import SyncedLyrics from './SyncedLyrics';
import ArtistInfo from './ArtistInfo';

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Simple average color extractor using Canvas
const getAverageColor = (imgUrl) => {
  return new Promise((resolve) => {
    if (!imgUrl) return resolve('rgb(42, 42, 42)');
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        // Darken the average color slightly for a better background
        resolve(`rgb(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)})`);
      } catch(e) {
        resolve('rgb(42, 42, 42)');
      }
    };
    img.onerror = () => resolve('rgb(42, 42, 42)');
  });
};

const DesktopNowPlaying = () => {
  const { currentTrack, desktopNowPlayingOpen, setDesktopNowPlayingOpen, isPlaying, togglePlay, progress, duration, seek } = usePlayerStore();
  const [bgColor, setBgColor] = useState('rgb(42, 42, 42)');
  const [artistImage, setArtistImage] = useState(null);

  useEffect(() => {
    if (currentTrack?.coverArt) {
      getAverageColor(currentTrack.coverArt).then(setBgColor);
    } else {
      setBgColor('rgb(42, 42, 42)');
    }
  }, [currentTrack]);

  const percentComplete = duration > 0 ? (progress / duration) : 0;

  // Generate fixed fake waveform data (100 bars)
  const waveformBars = useMemo(() => {
    const bars = [];
    for(let i=0; i<100; i++) {
      // Random height between 20% and 100%
      bars.push(20 + Math.random() * 80);
    }
    return bars;
  }, [currentTrack]); // Regenerate when track changes

  const handleWaveformClick = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    seek(percentage * duration);
  };

  return (
    <AnimatePresence>
      {desktopNowPlayingOpen && (
        <motion.div 
          className="desktop-now-playing-modal desktop-only"
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Top Bar with Back Button */}
          <div className="dnp-top-bar">
            <button 
              className="icon-btn back-btn" 
              onClick={() => setDesktopNowPlayingOpen(false)}
            >
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
          </div>

          <div className="dnp-content-wrapper">
            <div className="dnp-content">
              {/* Top Section: SoundCloud Style Header */}
              <div 
                className="dnp-header" 
                style={{ background: `linear-gradient(135deg, ${bgColor}, #111)` }}
              >
                <div className="dnp-header-left">
                    <div className="dnp-header-info-container">
                      <button className="dnp-play-btn" onClick={togglePlay}>
                        <span className="material-symbols-rounded" style={{ marginLeft: isPlaying ? '0' : '4px' }}>
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <div className="dnp-track-details">
                        <div className="dnp-title-pill">
                          <h1 className="dnp-title">{currentTrack?.title || 'No Track'}</h1>
                        </div>
                        <div className="dnp-artist-pill">
                          <h2 className="dnp-artist">{currentTrack?.artist || 'Unknown Artist'} {currentTrack?.album ? `- ${currentTrack.album}` : ''}</h2>
                        </div>
                      </div>
                    </div>
                    
                    {/* Waveform / Progress Area */}
                    <div className="dnp-waveform-container">
                      <div className="dnp-fake-waveform" onClick={handleWaveformClick}>
                        {waveformBars.map((height, i) => {
                          const isPlayed = (i / 100) <= percentComplete;
                          return (
                            <div 
                              key={i} 
                              className="dnp-wave-bar" 
                              style={{ 
                                height: `${height}%`,
                                background: isPlayed ? '#ff5500' : 'rgba(255,255,255,0.4)'
                              }} 
                            />
                          );
                        })}
                      </div>
                      <div className="dnp-waveform-times">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                </div>

                <div className="dnp-header-right">
                  <div className={`dnp-cover ${currentTrack?.coverArt ? '' : 'empty'}`}>
                    {currentTrack?.coverArt ? (
                      <img src={currentTrack.coverArt} alt="Cover" />
                    ) : (
                      <span className="material-symbols-rounded">music_note</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Lyrics and Artist Info */}
              <div className="dnp-body">
                <div className="dnp-lyrics-section">
                  <SyncedLyrics currentTrack={currentTrack} />
                </div>
                <div className="dnp-info-section">
                  <ArtistInfo currentTrack={currentTrack} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DesktopNowPlaying;
