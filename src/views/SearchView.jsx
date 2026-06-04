import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

const SearchView = () => {
  const { searchQuery, setSearchQuery, addToast, singles, playTrack } = usePlayerStore();
  const [onlineResults, setOnlineResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);
  const audioRef = useRef(null);

  // Debounced iTunes search & local filtering
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setOnlineResults([]);
      setLocalResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filteredLocal = singles.filter(track =>
      track.title?.toLowerCase().includes(lowerQuery) ||
      track.artist?.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
    setLocalResults(filteredLocal);

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=20`
        );
        const data = await res.json();
        if (data.results) {
          setOnlineResults(data.results.map(t => ({ ...t, previewUrl: t.previewUrl || null })));
        }
      } catch (e) {
        console.warn('Search error:', e);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, singles]);

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  // Stop preview when query clears
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPreviewingId(null); }
    }
  }, [searchQuery]);

  // ── Handlers ──

  // Use pointerDown so the action fires BEFORE the input loses focus on both
  // touch (iOS/Android) and desktop-resized-to-mobile (Chrome DevTools).
  const handleLocalPlay = (e, track) => {
    e.preventDefault(); // prevent input blur
    playTrack(track, singles);
    setSearchQuery('');
  };

  const handlePreviewPointer = (e, track) => {
    e.preventDefault();
    if (!track.previewUrl) return;

    if (previewingId === track.trackId) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPreviewingId(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.previewUrl);
    audio.volume = 0.5;
    audio.play().catch(err => addToast(`Preview error: ${err.message}`, 'error'));
    audio.onended = () => setPreviewingId(null);
    audioRef.current = audio;
    setPreviewingId(track.trackId);
  };

  const handleDownload = (e, track) => {
    e.preventDefault();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    addToast(`Downloading ${track.trackName}...`, 'loading');
    setSearchQuery('');
    import('../services/downloadManager')
      .then(m => m.startDownload({ title: track.trackName, artist: track.artistName }, backendUrl))
      .then(() => addToast(`Downloaded ${track.trackName}!`, 'success'))
      .catch(e => addToast(`Failed: ${e.message}`, 'error'));
  };

  // ── Render ──

  if (!searchQuery || searchQuery.trim().length < 2) {
    return (
      <div className="mobile-search-view">
        <div className="search-empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--color-text-muted)' }}>search</span>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '16px' }}>Search for songs, artists, or albums</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-search-view">
      {loading && (
        <div className="search-loading-state">
          <span className="material-symbols-rounded spin" style={{ fontSize: '32px' }}>progress_activity</span>
          <span style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Searching...</span>
        </div>
      )}

      {!loading && onlineResults.length === 0 && localResults.length === 0 && (
        <div className="search-empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--color-text-muted)' }}>search_off</span>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '12px' }}>No results for "{searchQuery}"</p>
        </div>
      )}

      {(localResults.length > 0 || onlineResults.length > 0) && (
        <div className="mobile-search-results">

          {/* Local Library results */}
          {localResults.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">Local Library</div>
              {localResults.map((track) => (
                <div
                  key={track.id}
                  className="search-result-item"
                  // onPointerDown fires before blur on BOTH touch and mouse
                  onPointerDown={(e) => handleLocalPlay(e, track)}
                >
                  <img
                    src={track.coverArt || ''}
                    alt={track.title}
                    className="search-result-art"
                    style={{ background: track.coverArt ? 'transparent' : 'rgba(255,255,255,0.05)' }}
                  />
                  <div className="search-result-info">
                    <span className="search-result-title">{track.title}</span>
                    <span className="search-result-artist">{track.artist}</span>
                  </div>
                  <span className="material-symbols-rounded" style={{ color: 'var(--color-primary)', fontSize: '1.5rem', flexShrink: 0 }}>
                    play_arrow
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Online results */}
          {onlineResults.length > 0 && (
            <div className="search-section">
              <div className="search-section-header" style={{ opacity: loading ? 0.5 : 1 }}>Online Results</div>
              {!loading && onlineResults.map((track) => (
                <div key={track.trackId} className="search-result-item">

                  {/* Preview toggle */}
                  <button
                    className="search-preview-btn"
                    onPointerDown={(e) => handlePreviewPointer(e, track)}
                    disabled={!track.previewUrl}
                  >
                    <span className="material-symbols-rounded">
                      {previewingId === track.trackId ? 'stop_circle' : 'play_circle'}
                    </span>
                  </button>

                  <img
                    src={track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '200x200bb') : ''}
                    alt={track.trackName}
                    className="search-result-art"
                  />

                  <div className="search-result-info">
                    <span className="search-result-title">{track.trackName}</span>
                    <span className="search-result-artist">{track.artistName}</span>
                  </div>

                  {/* Download */}
                  <button
                    className="search-download-btn"
                    onPointerDown={(e) => handleDownload(e, track)}
                  >
                    <span className="material-symbols-rounded">download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;
