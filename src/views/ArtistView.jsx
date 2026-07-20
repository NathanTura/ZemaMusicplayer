import React, { useState, useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { startDownload } from '../services/downloadManager';

const ArtistView = ({ setCurrentView, artist }) => {
  const { playTrack, library } = usePlayerStore();
  const [activeTab, setActiveTab] = useState('local');
  const [onlineData, setOnlineData] = useState({ topTracks: [], albums: [], loading: false, error: null });

  useEffect(() => {
    if (activeTab === 'online' && onlineData.topTracks.length === 0 && !onlineData.loading) {
      fetchOnlineData();
    }
  }, [activeTab]);

  const fetchOnlineData = async () => {
    setOnlineData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist.name)}&entity=song&limit=10`);
      const data = await res.json();
      
      const resAlbums = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist.name)}&entity=album&limit=10`);
      const dataAlbums = await resAlbums.json();

      setOnlineData({
        topTracks: data.results || [],
        albums: dataAlbums.results || [],
        loading: false,
        error: null
      });
    } catch (e) {
      setOnlineData(prev => ({ ...prev, loading: false, error: 'Failed to fetch online data' }));
    }
  };

  const isDownloaded = (trackName) => {
    return library.singles.some(t => t.title.toLowerCase() === trackName.toLowerCase()) || 
           library.albums.some(a => a.tracks.some(t => t.title.toLowerCase() === trackName.toLowerCase()));
  };

  if (!artist) {
    return (
      <div className="playlist-view">
        <div className="section-header">
          <button className="icon-btn" onClick={() => setCurrentView('Library')}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2>Artist not found</h2>
        </div>
      </div>
    );
  }

  const coverArt = artist.coverArt;

  return (
    <div className="playlist-view">
      <div className="collection-header" style={{ alignItems: 'center' }}>
        <button className="icon-btn back-btn" onClick={() => setCurrentView('Library')}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="collection-info" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
          {coverArt ? (
            <img className="collection-art" src={coverArt} alt={artist.name} style={{ borderRadius: '50%', width: '160px', height: '160px' }} />
          ) : (
            <div className="collection-art empty-collection-art" style={{ borderRadius: '50%', width: '160px', height: '160px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '64px' }}>person</span>
            </div>
          )}
          <div className="collection-text">
            <span>Verified Artist</span>
            <h1 style={{ fontSize: '3rem', margin: '10px 0' }}>{artist.name}</h1>
            <p>{artist.tracks.length} local songs</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="play-all-btn" onClick={() => {
                if (artist.tracks.length > 0) playTrack(artist.tracks[0], artist.tracks);
              }}>
                <span className="material-symbols-rounded">play_arrow</span>
                Play Local
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="artist-tabs" style={{ display: 'flex', gap: '20px', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
        <button 
          style={{ background: 'none', border: 'none', color: activeTab === 'local' ? '#1db954' : '#fff', padding: '10px 0', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'local' ? '2px solid #1db954' : '2px solid transparent' }}
          onClick={() => setActiveTab('local')}
        >
          Local Tracks
        </button>
        <button 
          style={{ background: 'none', border: 'none', color: activeTab === 'online' ? '#1db954' : '#fff', padding: '10px 0', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'online' ? '2px solid #1db954' : '2px solid transparent' }}
          onClick={() => setActiveTab('online')}
        >
          Explore (Online)
        </button>
      </div>

      <div className="collection-tracks">
        {activeTab === 'local' ? (
          <>
            {artist.tracks.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>No local tracks.</div>
            ) : (
              artist.tracks.map((track, i) => (
                <div className="track-item" key={i} onClick={() => playTrack(track, artist.tracks)}>
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
                </div>
              ))
            )}
          </>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {onlineData.loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading {artist.name}'s discography...</div>
            ) : onlineData.error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>{onlineData.error}</div>
            ) : (
              <>
                <h3 style={{ marginBottom: '15px' }}>Popular Tracks</h3>
                {onlineData.topTracks.map((track, i) => {
                  const downloaded = isDownloaded(track.trackName);
                  return (
                    <div className="track-item" key={i} style={{ opacity: downloaded ? 0.7 : 1 }}>
                      <div className="track-icon">
                        {track.artworkUrl100 ? (
                          <img src={track.artworkUrl100} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}} />
                        ) : (
                          <span className="material-symbols-rounded">music_note</span>
                        )}
                      </div>
                      <div className="track-info">
                        <div className="track-name">{track.trackName}</div>
                        <div className="track-artist">{track.artistName}</div>
                      </div>
                      {!downloaded && (
                        <button 
                          className="icon-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            startDownload({
                              title: track.trackName,
                              artist: track.artistName
                            });
                          }}
                          title="Download"
                        >
                          <span className="material-symbols-rounded">download</span>
                        </button>
                      )}
                      {downloaded && (
                        <span className="material-symbols-rounded" style={{ color: '#1db954', marginRight: '10px' }} title="Downloaded">check_circle</span>
                      )}
                    </div>
                  );
                })}

                <h3 style={{ marginTop: '40px', marginBottom: '15px' }}>Discography</h3>
                <div className="horizontal-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
                  {onlineData.albums.map((album, i) => (
                    <div className="card" key={i} style={{ minWidth: '160px' }}>
                      {album.artworkUrl100 ? (
                        <img className="card-art" src={album.artworkUrl100.replace('100x100bb', '300x300bb')} alt="Cover" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="card-art empty-card-art"><span className="material-symbols-rounded">album</span></div>
                      )}
                      <div className="card-title">{album.collectionName}</div>
                      <div className="card-subtitle">{album.releaseDate?.substring(0, 4)} • Album</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistView;
