import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const HomeView = ({ setCurrentView }) => {
  const { history, library, artists, playTrack, setSelectedPlaylist, setSelectedArtist, setLibraryActiveTab } = usePlayerStore();

  const handleSeeAllHistory = () => {
    setLibraryActiveTab('History');
    setCurrentView('Library');
  };

  const handleSeeAllPlaylists = () => {
    setLibraryActiveTab('Playlists');
    setCurrentView('Library');
  };

  const handleSeeAllArtists = () => {
    setLibraryActiveTab('Artists');
    setCurrentView('Library');
  };

  const recentArtistsMap = new Map();
  history.forEach(t => {
    if (t.artist && t.artist !== 'Unknown Artist' && !recentArtistsMap.has(t.artist)) {
      const artistObj = artists?.find(a => a.name === t.artist);
      if (artistObj) recentArtistsMap.set(t.artist, artistObj);
    }
  });
  let recentArtists = Array.from(recentArtistsMap.values());
  if (artists && recentArtists.length < 5) {
    const extraArtists = artists.filter(a => !recentArtistsMap.has(a.name));
    recentArtists = [...recentArtists, ...extraArtists].slice(0, 5);
  } else {
    recentArtists = recentArtists.slice(0, 5);
  }

  return (
  <div className="home-view">
    <section className="music-section">
      <div className="section-header">
        <h2>Recently Played</h2>
        <button className="see-all-btn" onClick={handleSeeAllHistory}>See All</button>
      </div>
      <div className="grid-scroll-2-rows">
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
        <button className="see-all-btn" onClick={handleSeeAllPlaylists}>See All</button>
      </div>
      <div className="horizontal-scroll">
        {library.playlists.length === 0 ? (
          <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">queue_music</span></div><div className="card-title">No Playlists</div><div className="card-subtitle">Local Folder</div></div>
        ) : (
          library.playlists.slice(0, 10).map((playlist, i) => (
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

    <section className="music-section">
      <div className="section-header">
        <h2>Artists</h2>
        <button className="see-all-btn" onClick={handleSeeAllArtists}>See All</button>
      </div>
      <div className="horizontal-scroll">
        {recentArtists.length === 0 ? (
          <div className="card"><div className="card-art empty-card-art artist-card-art" style={{ borderRadius: '50%' }}><span className="material-symbols-rounded">person</span></div><div className="card-title">No Artists</div><div className="card-subtitle">Add some music</div></div>
        ) : (
          recentArtists.map((artist, i) => (
            <div className="card" key={i} onClick={() => {
              setSelectedArtist(artist);
              setCurrentView('ArtistDetails');
            }}>
              {artist.coverArt ? (
                <img className="card-art artist-card-art" src={artist.coverArt} alt="Artist" style={{ objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <div className="card-art empty-card-art artist-card-art" style={{ borderRadius: '50%' }}><span className="material-symbols-rounded">person</span></div>
              )}
              <div className="card-title" style={{ textAlign: 'center' }}>{artist.name}</div>
              <div className="card-subtitle" style={{ textAlign: 'center' }}>Artist</div>
            </div>
          ))
        )}
      </div>
    </section>
  </div>
  );
};

export default HomeView;
