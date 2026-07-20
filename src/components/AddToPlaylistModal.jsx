import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';
import { createPlaylistFolder, addTrackToPlaylistFolder, loadLibrary } from '../services/FileSystem';

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
  const { library, setLibrary, addToast } = usePlayerStore();
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setShowNewInput(false);
      setNewName('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (showNewInput) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [showNewInput]);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = async (playlistName) => {
    if (!track.path && !track.fileHandle) {
      addToast('Cannot add unsaved track to playlist', 'error');
      return;
    }
    try {
      // Use track.path for JSON playlists. Fallback to track.id for mobile/external.
      const trackId = track.path || track.id;
      await addTrackToPlaylistFolder(playlistName, trackId);
      addToast(`Added to "${playlistName}"`, 'success');
      const lib = await loadLibrary();
      setLibrary(lib.singles, lib.albums, lib.playlists);
      onClose();
    } catch (e) {
      addToast('Failed to add to playlist', 'error');
      console.error(e);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await createPlaylistFolder(trimmed);
      addToast(`Playlist "${trimmed}" created`, 'success');
      const lib = await loadLibrary();
      setLibrary(lib.singles, lib.albums, lib.playlists);
      setNewName('');
      setShowNewInput(false);
    } catch (e) {
      addToast('Failed to create playlist', 'error');
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add to Playlist</h3>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Track preview */}
          <div className="track-preview">
            {track.coverArt ? (
              <img src={track.coverArt} alt="" />
            ) : (
              <div className="empty-art"><span className="material-symbols-rounded">music_note</span></div>
            )}
            <div>
              <div className="track-name">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
          </div>

          {/* Create new playlist — expandable */}
          <AnimatePresence initial={false}>
            {showNewInput ? (
              <motion.form
                key="new-input"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleCreateNew}
                style={{ overflow: 'hidden' }}
              >
                <div className="playlist-name-field" style={{ marginBottom: '10px' }}>
                  <span className="material-symbols-rounded playlist-name-icon">queue_music</span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="playlist-name-input"
                    placeholder="Playlist name..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={60}
                    autoComplete="off"
                  />
                </div>
                <div className="modal-actions" style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowNewInput(false); setNewName(''); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={!newName.trim()}>
                    Create
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.button
                key="new-btn"
                className="create-new-btn"
                onClick={() => setShowNewInput(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="material-symbols-rounded">add</span>
                New Playlist
              </motion.button>
            )}
          </AnimatePresence>

          {/* Existing playlists */}
          <div className="playlist-list">
            {library.playlists.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                No playlists yet — create one above
              </div>
            ) : (
              library.playlists.map(playlist => (
                <button
                  key={playlist.name}
                  className="playlist-select-btn"
                  onClick={() => handleAddToPlaylist(playlist.name)}
                >
                  {playlist.tracks[0]?.coverArt ? (
                    <img
                      src={playlist.tracks[0].coverArt}
                      alt=""
                      style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <span className="material-symbols-rounded">queue_music</span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <span style={{ fontWeight: 600 }}>{playlist.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddToPlaylistModal;
