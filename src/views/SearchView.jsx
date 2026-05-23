import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

const SearchView = () => {
  const { searchQuery } = usePlayerStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);
  const audioRef = useRef(null);

  // Debounced iTunes search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=20`
        );
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
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

  const handlePreview = (track) => {
    if (!track.previewUrl) return;

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
    audio.play().catch(console.warn);
    audio.onended = () => setPreviewingId(null);
    audioRef.current = audio;
    setPreviewingId(track.trackId);
  };

  const handleDownload = async (track) => {
    const query = `${track.trackName} ${track.artistName}`;
    const backendUrl = process.env.SearchViewurl; // TODO: Update to Render URL later
    
    alert(`Starting download for ${track.trackName}... This might take a few seconds.`);
    
    try {
      const response = await fetch(`${backendUrl}/download?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error("Download failed from backend");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.artistName} - ${track.trackName}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`Successfully downloaded ${track.trackName}! Move it to your Zema folder to see it in your library.`);
    } catch (e) {
      console.error(e);
      alert(`Failed to download: ${e.message}`);
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

      {!loading && results.length === 0 && (
        <div className="search-empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--color-text-muted)' }}>search_off</span>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '12px' }}>No results for "{searchQuery}"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mobile-search-results">
          {results.map((track) => (
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
  );
};

export default SearchView;
