import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

// Helper to parse LRC string into an array of { time: seconds, text: string }
const parseLRC = (lrcString) => {
  const lines = lrcString.split('\n');
  const lyrics = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      const timeInSeconds = mins * 60 + secs + (ms / (match[3].length === 3 ? 1000 : 100));
      const text = line.replace(timeRegex, '').trim();
      lyrics.push({ time: timeInSeconds, text });
    }
  });
  
  return lyrics;
};

const SyncedLyrics = ({ currentTrack }) => {
  const [lyrics, setLyrics] = useState([]);
  const containerRef = useRef(null);
  
  const { progress, seek, preloadedLyrics, preloadedLyricsError } = usePlayerStore();

  useEffect(() => {
    if (!currentTrack || !currentTrack.title || !currentTrack.artist) {
      setLyrics([]);
      return;
    }

    if (preloadedLyrics) {
      if (preloadedLyricsError === 'plain') {
        const plainLines = preloadedLyrics.split('\n');
        const dummyLyrics = plainLines.map((line, idx) => ({ time: idx * 5, text: line })); // Very rough fallback
        setLyrics(dummyLyrics);
      } else {
        setLyrics(parseLRC(preloadedLyrics));
      }
    } else {
      setLyrics([]);
    }
  }, [currentTrack, preloadedLyrics, preloadedLyricsError]);

  // Find current active lyric index
  let activeIndex = -1;
  if (lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (progress >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Scroll to active lyric
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeEl = containerRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeIndex]);

  if (!preloadedLyrics && !preloadedLyricsError) {
    return <div className="lyrics-container"><div className="lyrics-message">Loading lyrics...</div></div>;
  }

  if (preloadedLyricsError && preloadedLyricsError !== 'plain') {
    return <div className="lyrics-container"><div className="lyrics-message">{preloadedLyricsError}</div></div>;
  }

  if (lyrics.length === 0) {
    return <div className="lyrics-container"><div className="lyrics-message">No lyrics available</div></div>;
  }

  return (
    <div className="lyrics-container" ref={containerRef}>
      {lyrics.map((line, idx) => (
        <div 
          key={idx} 
          className={`lyric-line ${idx === activeIndex ? 'active' : ''} ${idx < activeIndex ? 'passed' : ''}`}
          onClick={() => seek(line.time)}
        >
          {line.text || '♪'}
        </div>
      ))}
    </div>
  );
};

export default SyncedLyrics;
