import React from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { removeTrackFromPlaylistFolder, loadLibrary } from '../services/FileSystem';

const PlaylistView = ({ setCurrentView, playlist }) => {
  const { playTrack, library, setLibrary, addToast } = usePlayerStore();

  if (!playlist) {
    return (
      <div className="playlist-view">
        <div className="section-header">
          <button className="icon-btn" onClick={() => setCurrentView('Library')}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2>Playlist not found</h2>
        </div>
      </div>
    );
  }

  const coverArt = playlist.tracks[0]?.coverArt;

  return (
    <div className="playlist-view">
      <div className="collection-header">
        <button className="icon-btn back-btn" onClick={() => setCurrentView('Library')}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="collection-info">
          {coverArt ? (
            <img className="collection-art" src={coverArt} alt={playlist.name} />
          ) : (
            <div className="collection-art empty-collection-art">
              <span className="material-symbols-rounded">queue_music</span>
            </div>
          )}
          <div className="collection-text">
            <span>Playlist</span>
            <h1>{playlist.name}</h1>
            <p>{playlist.tracks.length} songs</p>
            <button className="play-all-btn" onClick={() => {
              if (playlist.tracks.length > 0) playTrack(playlist.tracks[0], playlist.tracks);
            }}>
              <span className="material-symbols-rounded">play_arrow</span>
              Play All
            </button>
          </div>
        </div>
      </div>

      <div className="collection-tracks">
        {playlist.tracks.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>No tracks in this playlist yet.</div>
        ) : (
          playlist.tracks.map((track, i) => (
            <div className="track-item" key={i} onClick={() => playTrack(track, playlist.tracks)}>
              <div className="track-icon">
                {track.coverArt ? (
                  <img src={track.coverArt} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}} />
                ) : (
                  <span className="material-symbols-rounded">music_note</span>
                )}
              </div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              <button 
                className="icon-btn" 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // track.path is used for JSON playlists
                    const trackId = track.path || track.id;
                    await removeTrackFromPlaylistFolder(playlist.name, trackId);
                    addToast('Removed from playlist', 'info');
                    const lib = await loadLibrary();
                    setLibrary(lib.singles, lib.albums, lib.playlists);
                    
                    // Update current view if it was modified
                    const updatedPlaylist = lib.playlists.find(p => p.name === playlist.name);
                    if (updatedPlaylist) {
                      usePlayerStore.getState().setSelectedPlaylist(updatedPlaylist);
                    } else {
                      // If playlist is now empty or missing
                      setCurrentView('Library');
                    }
                  } catch(err) {
                    addToast('Failed to remove track', 'error');
                  }
                }}
                title="Remove from playlist"
              >
                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistView;
