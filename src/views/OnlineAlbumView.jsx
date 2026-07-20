import React, { useState, useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { startDownload } from '../services/downloadManager';

const OnlineAlbumView = ({ setCurrentView }) => {
  const { selectedOnlineAlbum, library, activeDownloads } = usePlayerStore();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedOnlineAlbum) {
      fetchAlbumTracks();
    }
  }, [selectedOnlineAlbum]);

  const fetchAlbumTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${selectedOnlineAlbum.collectionId}&entity=song`);
      const data = await res.json();
      // The first result is the album itself, the rest are tracks
      const songResults = data.results.filter(r => r.wrapperType === 'track');
      setTracks(songResults);
      setLoading(false);
    } catch (e) {
      setError('Failed to fetch album tracks');
      setLoading(false);
    }
  };

  const isDownloaded = (trackName) => {
    return library.singles.some(t => t.title.toLowerCase() === trackName.toLowerCase()) || 
           library.albums.some(a => a.tracks.some(t => t.title.toLowerCase() === trackName.toLowerCase()));
  };
  
  const isDownloading = (trackName) => {
    return activeDownloads.some(d => d.title.toLowerCase() === trackName.toLowerCase() && d.status === 'downloading');
  };

  const handleDownloadAll = () => {
    tracks.forEach(track => {
      if (!isDownloaded(track.trackName) && !isDownloading(track.trackName)) {
        startDownload({
          title: track.trackName,
          artist: track.artistName
        });
      }
    });
  };

  if (!selectedOnlineAlbum) {
    return (
      <div className="playlist-view">
        <div className="section-header">
          <button className="icon-btn" onClick={() => setCurrentView('ArtistDetails')}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2>Album not found</h2>
        </div>
      </div>
    );
  }

  const coverArt = selectedOnlineAlbum.artworkUrl100 ? selectedOnlineAlbum.artworkUrl100.replace('100x100bb', '600x600bb') : null;

  return (
    <div className="playlist-view">
      <div className="collection-header">
        <button className="icon-btn back-btn" onClick={() => setCurrentView('ArtistDetails')}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="collection-info">
          {coverArt ? (
            <img className="collection-art" src={coverArt} alt="Cover" />
          ) : (
            <div className="collection-art empty-collection-art">
              <span className="material-symbols-rounded">album</span>
            </div>
          )}
          <div className="collection-text">
            <span>Online Album</span>
            <h1>{selectedOnlineAlbum.collectionName}</h1>
            <p>{selectedOnlineAlbum.artistName} • {selectedOnlineAlbum.releaseDate?.substring(0, 4)} • {tracks.length} tracks</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="play-all-btn" onClick={handleDownloadAll} disabled={tracks.length === 0}>
                <span className="material-symbols-rounded">download</span>
                Save Album
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="collection-tracks">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Loading tracks...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>{error}</div>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No tracks found.</div>
        ) : (
          tracks.map((track, i) => {
            const downloaded = isDownloaded(track.trackName);
            const downloading = isDownloading(track.trackName);
            return (
              <div className="track-item" key={i} style={{ opacity: downloaded ? 0.7 : 1 }}>
                <div className="track-number">{track.trackNumber}</div>
                <div className="track-info">
                  <div className="track-name">{track.trackName}</div>
                  <div className="track-artist">{track.artistName}</div>
                </div>
                {!downloaded && !downloading && (
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
                {downloading && (
                  <span className="material-symbols-rounded" style={{ color: 'var(--color-primary)', marginRight: '10px' }} title="Downloading">hourglass_empty</span>
                )}
                {downloaded && (
                  <span className="material-symbols-rounded" style={{ color: '#1db954', marginRight: '10px' }} title="Downloaded">check_circle</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OnlineAlbumView;
