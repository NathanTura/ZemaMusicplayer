import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FolderBanner from '../components/FolderBanner';
import usePlayerStore from '../store/usePlayerStore';

const LibraryView = ({ localFiles, onBrowseClick, fileInputRef, onFileChange, setCurrentView }) => {
  const tabs = useMemo(() => ['Singles', 'Albums', 'Playlists', 'History', 'Likes'], []);
  const [activeTab, setActiveTab] = useState('Singles');
  const [direction, setDirection] = useState(0);

  const { singles, albums, playlists, customPlaylists, createPlaylist, history, likes, playTrack, setSelectedAlbum, setSelectedPlaylist } = usePlayerStore();

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    const currentIndex = tabs.indexOf(tab);
    const prevIndex = tabs.indexOf(activeTab);
    setDirection(currentIndex > prevIndex ? 1 : -1);
    setActiveTab(tab);
  };

  const tabVariants = {
    initial: (direction) => ({
      x: direction > 0 ? '50px' : '-50px',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? '-50px' : '50px',
      opacity: 0
    })
  };

  const renderContent = () => {
    if (activeTab === 'Singles') {
      if (singles.length === 0) return renderEmpty('Singles', 'music_note');
      return (
        <div className="track-list">
          {singles.map((track, i) => (
            <div className="track-item" key={i} onClick={() => playTrack(track, singles)}>
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
          ))}
        </div>
      );
    }
    
    if (activeTab === 'Albums') {
      if (albums.length === 0) return renderEmpty('Albums', 'album');
      return (
        <div className="horizontal-scroll">
          {albums.map((album, i) => (
            <div className="card" key={i} onClick={() => {
              setSelectedAlbum(album);
              setCurrentView('AlbumDetails');
            }}>
              {album.tracks[0]?.coverArt ? (
                <img className="card-art" src={album.tracks[0].coverArt} alt="Cover" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="card-art empty-card-art"><span className="material-symbols-rounded">album</span></div>
              )}
              <div className="card-title">{album.name}</div>
              <div className="card-subtitle">{album.tracks.length} tracks</div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'Playlists') {
      const allPlaylists = [...customPlaylists, ...playlists];
      
      return (
        <div className="playlists-container">
          <button 
            className="btn-primary" 
            style={{ marginBottom: '24px' }}
            onClick={() => {
              const name = prompt('Enter playlist name:');
              if (name && name.trim()) {
                createPlaylist(name.trim());
              }
            }}
          >
            <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '8px' }}>add</span>
            Create Playlist
          </button>
          
          {allPlaylists.length === 0 ? (
            renderEmpty('Playlists', 'queue_music')
          ) : (
            <div className="horizontal-scroll">
              {allPlaylists.map((playlist, i) => (
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
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'History') {
      if (history.length === 0) return renderEmpty('History', 'history');
      return (
        <div className="track-list">
          {history.map((track, i) => (
            <div className="track-item" key={i} onClick={() => playTrack(track, history)}>
              <div className="track-icon">
                {track.coverArt ? (
                  <img src={track.coverArt} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}} />
                ) : (
                  <span className="material-symbols-rounded">history</span>
                )}
              </div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'Likes') {
      if (likes.length === 0) return renderEmpty('Likes', 'favorite');
      return (
        <div className="track-list">
          {likes.map((track, i) => (
            <div className="track-item" key={i} onClick={() => playTrack(track, likes)}>
              <div className="track-icon">
                {track.coverArt ? (
                  <img src={track.coverArt} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}} />
                ) : (
                  <span className="material-symbols-rounded">favorite</span>
                )}
              </div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return renderEmpty(activeTab, activeTab === 'Playlists' ? 'queue_music' : 'help');
  };

  const renderEmpty = (name, icon) => (
    <div className="horizontal-scroll">
      <div className="card">
        <div className="card-art empty-card-art">
          <span className="material-symbols-rounded">{icon}</span>
        </div>
        <div className="card-title">Empty {name}</div>
        <div className="card-subtitle">No items found</div>
      </div>
    </div>
  );

  return (
    <div className="library-view" style={{ overflowX: 'hidden' }}>
      <FolderBanner />

      <div className="library-subnav">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`subnav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="library-content" style={{ position: 'relative' }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 }
            }}
          >
            <section className="music-section">
              <div className="section-header">
                <h2>{activeTab}</h2>
              </div>
              {renderContent()}
            </section>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LibraryView;
