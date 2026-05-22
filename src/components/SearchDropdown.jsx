import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

const SearchDropdown = () => {
  const { searchQuery, setSearchQuery } = usePlayerStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const audioRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced iTunes search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=6`,
          { signal: controller.signal }
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

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Don't clear if clicking on the search input itself
        const searchInput = document.querySelector('.nav-search input');
        if (searchInput && searchInput.contains(e.target)) return;
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setSearchQuery]);

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
      // Stop preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    // Play new preview
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
    const backendUrl = "http://localhost:8000"; // TODO: Update to Render URL later
    
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

  if (!searchQuery || searchQuery.trim().length < 2) return null;

  return (
    <div className="search-dropdown desktop-only" ref={dropdownRef}>
      {loading && (
        <div className="search-dropdown-loading">
          <span className="material-symbols-rounded spin">progress_activity</span>
          <span>Searching...</span>
        </div>
      )}

      {!loading && results.length === 0 && searchQuery.length >= 2 && (
        <div className="search-dropdown-empty">
          <span className="material-symbols-rounded">search_off</span>
          <span>No results found</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-dropdown-results">
          {results.map((track) => (
            <div key={track.trackId} className="search-result-item">
              <button
                className="search-preview-btn"
                onClick={() => handlePreview(track)}
                title={track.previewUrl ? 'Preview 30s' : 'No preview available'}
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
                title="Download to Zema"
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

export default SearchDropdown;
