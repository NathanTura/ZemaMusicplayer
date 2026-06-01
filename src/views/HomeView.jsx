import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const HomeView = ({ setCurrentView }) => {
  const { history, playlists, playTrack, setSelectedPlaylist } = usePlayerStore();

  return (
  <div className="home-view">
    <section className="music-section">
      <div className="section-header">
        <h2>Recently Played</h2>
      </div>
      <div className="horizontal-scroll">
        {history.length === 0 ? (
          <>
            <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">history</span></div><div className="card-title">No History</div><div className="card-subtitle">Play some tracks</div></div>
          </>
        ) : (
          history.slice(0, 10).map((track, i) => (
            <div className="card" key={i} onClick={() => playTrack(track, history)}>
              {track.coverArt ? (
                <img className="card-art" src={track.coverArt} alt="Cover" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="card-art empty-card-art"><span className="material-symbols-rounded">music_note</span></div>
              )}
              <div className="card-title">{track.title}</div>
              <div className="card-subtitle">{track.artist}</div>
            </div>
          ))
        )}
      </div>
    </section>

    <section className="music-section">
      <div className="section-header">
        <h2>Playlists</h2>
        <button className="see-all-btn">See All</button>
      </div>
      <div className="horizontal-scroll">
        {playlists.length === 0 ? (
          <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">queue_music</span></div><div className="card-title">No Playlists</div><div className="card-subtitle">Local Folder</div></div>
        ) : (
          playlists.slice(0, 10).map((playlist, i) => (
            <div className="card" key={i} onClick={() => {
              setSelectedPlaylist(playlist);
              setCurrentView('PlaylistDetails');
            }}>
              {playlist.tracks[0]?.coverArt ? (
                <img className="card-art" src={playlist.tracks[0].coverArt} alt="Cover" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="card-art empty-card-art"><span className="material-symbols-rounded">queue_music</span></div>
              )}
              <div className="card-title">{playlist.name}</div>
              <div className="card-subtitle">{playlist.tracks.length} tracks</div>
            </div>
          ))
        )}
      </div>
    </section>
  </div>
  );
};

export default HomeView;
