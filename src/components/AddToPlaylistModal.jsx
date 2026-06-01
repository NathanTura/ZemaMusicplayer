import React from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { createPlaylistFolder, addTrackToPlaylistFolder, loadLibrary } from '../services/FileSystem';

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
  const { library, setLibrary, addToast } = usePlayerStore();

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = async (playlistName) => {
    if (!track.fileHandle) {
      addToast('Cannot add unsaved track to playlist', 'error');
      return;
    }
    try {
      await addTrackToPlaylistFolder(playlistName, track.fileHandle);
      addToast(`Added to ${playlistName}`, 'success');
      // Reload library to show updated playlist
      const lib = await loadLibrary();
      setLibrary(lib.singles, lib.albums, lib.playlists);
      onClose();
    } catch(e) {
      addToast('Failed to add to playlist', 'error');
      console.error(e);
    }
  };

  const handleCreateNew = async () => {
    const name = prompt('Enter new playlist name:');
    if (name && name.trim()) {
      try {
        await createPlaylistFolder(name.trim());
        addToast(`Playlist created`, 'success');
        const lib = await loadLibrary();
        setLibrary(lib.singles, lib.albums, lib.playlists);
      } catch(e) {
        addToast('Failed to create playlist', 'error');
        console.error(e);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add to Playlist</h3>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        
        <div className="modal-body">
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

          <button className="create-new-btn" onClick={handleCreateNew}>
            <span className="material-symbols-rounded">add</span>
            New Playlist
          </button>

          <div className="playlist-list">
            {library.playlists.length === 0 ? (
              <div className="empty-state" style={{padding: '20px 0'}}>No custom playlists yet.</div>
            ) : (
              library.playlists.map(playlist => (
                <button 
                  key={playlist.name} 
                  className="playlist-select-btn"
                  onClick={() => handleAddToPlaylist(playlist.name)}
                >
                  <span className="material-symbols-rounded">queue_music</span>
                  {playlist.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
