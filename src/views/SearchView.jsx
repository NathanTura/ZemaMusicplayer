import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles } from '../services/FileSystem';

const SearchView = () => {
  const { searchQuery, setSearchQuery, addToast, addDownload, updateDownload, singles, playTrack } = usePlayerStore();
  const [onlineResults, setOnlineResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);
  const audioRef = useRef(null);

  // Debounced iTunes search & Local filtering
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setOnlineResults([]);
      setLocalResults([]);
      return;
    }

    // Filter Local Library
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
          console.log('iTunes search results:', data.results);
          // Filter results and verify previewUrl exists
          const resultsWithPreview = data.results.map(track => ({
            ...track,
            previewUrl: track.previewUrl || null
          }));
          setOnlineResults(resultsWithPreview);
        }
      } catch (e) {
        console.warn('Search error:', e);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Stop preview when search query clears or becomes too short
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPreviewingId(null);
      }
    }
  }, [searchQuery]);

  const handlePreview = (track) => {
    console.log('handlePreview called:', track.trackName, 'previewUrl:', track.previewUrl);
    
    if (!track.previewUrl) {
      console.warn('No preview URL available for:', track.trackName);
      return;
    }

    if (previewingId === track.trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.previewUrl);
    audio.volume = 0.5;
    audio.play()
      .then(() => {
        console.log('Preview playing:', track.trackName);
      })
      .catch(err => {
        console.error('Preview playback error:', err);
        addToast(`Preview error: ${err.message}`, 'error');
      });
    audio.onended = () => {
      console.log('Preview ended:', track.trackName);
      setPreviewingId(null);
    };
    audioRef.current = audio;
    setPreviewingId(track.trackId);
  };

  const handleDownload = async (track) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    addToast(`Downloading ${track.trackName}...`, 'loading');
    setSearchQuery(''); // Clear search to return to previous view
    try {
      await import('../services/downloadManager').then(m => m.startDownload({ title: track.trackName, artist: track.artistName }, backendUrl));
      addToast(`Downloaded ${track.trackName}!`, 'success');
    } catch (e) {
      console.error(e);
      addToast(`Failed: ${e.message}`, 'error');
    }
  };

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

          {localResults.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">Local Library</div>
              {localResults.map((track) => (
                <div key={track.id} className="search-result-item">
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
                  <button
                    className="search-download-btn"
                    onClick={() => {
                      playTrack(track, singles);
                      setSearchQuery('');
                    }}
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <span className="material-symbols-rounded">play_arrow</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {onlineResults.length > 0 && (
            <div className="search-section">
              <div className="search-section-header" style={{ opacity: loading ? 0.5 : 1 }}>Online Results</div>
              {!loading && onlineResults.map((track) => (
                <div key={track.trackId} className="search-result-item">
              <button
                className="search-preview-btn"
                onClick={() => handlePreview(track)}
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

              <button
                className="search-download-btn"
                onClick={() => handleDownload(track)}
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
