import React, { useState, useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles } from '../services/FileSystem';

const SearchDropdown = () => {
  const { searchQuery, setSearchQuery, addToast, addDownload, updateDownload } = usePlayerStore();
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
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    
    // Create track object for download state
    const trackData = {
      title: track.trackName,
      artist: track.artistName,
      coverArt: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '200x200bb') : ''
    };
    
    // Get the generated ID from the store by temporarily subscribing or we can just let addToast handle toast, 
    // but better, let's generate the ID here and pass it
    const downloadId = Date.now().toString();
    const newDownload = { ...trackData, id: downloadId, status: 'downloading' };
    
    // We update the store state directly via addDownload if we passed it in, 
    // but we can just use a slightly modified action or just let the store generate ID and we retrieve it?
    // Let's change addDownload in the store to accept an ID if provided.
    // Actually, I can just do:
    usePlayerStore.setState(state => ({
      activeDownloads: [newDownload, ...state.activeDownloads],
      downloadsModalOpen: true
    }));
    
    addToast(`Downloading ${track.trackName}...`, 'loading');
    
    try {
      const response = await fetch(`${backendUrl}/download?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error("Download failed from backend");
      
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      
      const reader = response.body.getReader();
      const chunks = [];
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total) {
          usePlayerStore.getState().updateDownloadProgress(downloadId, loaded, total);
        }
      }
      
      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const filename = `${track.artistName} - ${track.trackName}.mp3`;
      
      // Save directly to Zema directory via File System Access API
      const savedToZema = await saveBlobToSingles(blob, filename);
      
      if (savedToZema) {
         // Reload library in background so the new track appears
         import('../services/FileSystem').then(m => m.loadLibrary().then(lib => {
            usePlayerStore.getState().setLibrary(lib.singles, lib.albums, lib.playlists);
         }));
      }
      
      updateDownload(downloadId, 'completed');
      addToast(`Downloaded ${track.trackName}!`, 'success');
      
      // Auto-remove completed download after 5 seconds
      setTimeout(() => {
        usePlayerStore.getState().removeDownload(downloadId);
      }, 5000);
      
    } catch (e) {
      console.error(e);
      updateDownload(downloadId, 'failed');
      addToast(`Failed: ${e.message}`, 'error');
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
