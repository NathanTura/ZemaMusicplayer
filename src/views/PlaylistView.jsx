import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const PlaylistView = ({ setCurrentView, playlist }) => {
  const { playTrack } = usePlayerStore();

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
          <div className="empty-state">No tracks in this playlist yet.</div>
        ) : (
          playlist.tracks.map((track, i) => (
            <div className="track-item" key={i} onClick={() => playTrack(track, playlist.tracks)}>
              <div className="track-index">{i + 1}</div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistView;
