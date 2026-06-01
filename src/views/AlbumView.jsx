import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const AlbumView = ({ setCurrentView, album }) => {
  const { playTrack } = usePlayerStore();

  if (!album) {
    return (
      <div className="album-view">
        <div className="section-header">
          <button className="icon-btn" onClick={() => setCurrentView('Library')}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2>Album not found</h2>
        </div>
      </div>
    );
  }

  const coverArt = album.tracks[0]?.coverArt;

  return (
    <div className="album-view">
      <div className="collection-header">
        <button className="icon-btn back-btn" onClick={() => setCurrentView('Library')}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="collection-info">
          {coverArt ? (
            <img className="collection-art" src={coverArt} alt={album.name} />
          ) : (
            <div className="collection-art empty-collection-art">
              <span className="material-symbols-rounded">album</span>
            </div>
          )}
          <div className="collection-text">
            <span>Album</span>
            <h1>{album.name}</h1>
            <p>{album.tracks[0]?.artist || 'Unknown Artist'} • {album.tracks.length} songs</p>
            <button className="play-all-btn" onClick={() => playTrack(album.tracks[0], album.tracks)}>
              <span className="material-symbols-rounded">play_arrow</span>
              Play All
            </button>
          </div>
        </div>
      </div>

      <div className="collection-tracks">
        {album.tracks.map((track, i) => (
          <div className="track-item" key={i} onClick={() => playTrack(track, album.tracks)}>
            <div className="track-index">{i + 1}</div>
            <div className="track-info">
              <div className="track-name">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumView;
