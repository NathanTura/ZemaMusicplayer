import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
  const { customPlaylists, addToPlaylist, createPlaylist, addToast } = usePlayerStore();

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = (playlistId) => {
    addToPlaylist(playlistId, track);
    addToast(`Added to playlist`, 'success');
    onClose();
  };

  const handleCreateNew = () => {
    const name = prompt('Enter new playlist name:');
    if (name && name.trim()) {
      createPlaylist(name.trim());
      // The store updates, but we need the new ID. 
      // It's easier to just let them click it after creating.
      addToast(`Playlist created`, 'success');
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
            {customPlaylists.length === 0 ? (
              <div className="empty-state" style={{padding: '20px 0'}}>No custom playlists yet.</div>
            ) : (
              customPlaylists.map(playlist => (
                <button 
                  key={playlist.id} 
                  className="playlist-select-btn"
                  onClick={() => handleAddToPlaylist(playlist.id)}
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
