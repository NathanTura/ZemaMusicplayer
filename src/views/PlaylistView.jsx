import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const PlaylistView = ({ setCurrentView, playlist }) => {
  const { playTrack, customPlaylists, removeFromPlaylist, addToast } = usePlayerStore();
  
  // Check if this is a custom playlist (has an ID that matches one in customPlaylists)
  const isCustom = customPlaylists.some(p => p.id === playlist?.id);

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
              {isCustom && (
                <button 
                  className="icon-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(playlist.id, track.id);
                    addToast('Removed from playlist', 'info');
                  }}
                  title="Remove from playlist"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>close</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistView;
