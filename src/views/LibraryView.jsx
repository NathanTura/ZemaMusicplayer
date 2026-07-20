import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPlaylistFolder, loadLibrary } from '../services/FileSystem';
import FolderBanner from '../components/FolderBanner';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import usePlayerStore from '../store/usePlayerStore';

const LibraryView = ({ localFiles, onBrowseClick, fileInputRef, onFileChange, setCurrentView }) => {
  const tabs = useMemo(() => ['Singles', 'Albums', 'Artists', 'Playlists', 'History', 'Likes'], []);
  const [direction, setDirection] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  
  const { singles, albums, library, artists, setLibrary, history, likes, playTrack, setSelectedAlbum, setSelectedPlaylist, setSelectedArtist, setPlaylistModalTrack, addToast, libraryActiveTab, setLibraryActiveTab, currentTrack, isPlaying } = usePlayerStore();

  const handleTabChange = (tab) => {
    if (tab === libraryActiveTab) return;
    const currentIndex = tabs.indexOf(tab);
    const prevIndex = tabs.indexOf(libraryActiveTab);
    setDirection(currentIndex > prevIndex ? 1 : -1);
    setLibraryActiveTab(tab);
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
    if (libraryActiveTab === 'Singles') {
      if (singles.length === 0) return renderEmpty('Singles', 'music_note');
      return (
        <div className="track-list">
          {singles.map((track, i) => {
            const isThisTrackPlaying = currentTrack?.id === track.id;
            return (
              <div className={`track-item ${isThisTrackPlaying ? 'playing' : ''}`} key={i} onClick={() => playTrack(track, singles)}>
                <div className="track-icon queue-art" style={{ position: 'relative' }}>
                  {isThisTrackPlaying && isPlaying ? (
                    <div className="playing-animation">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  ) : track.coverArt ? (
                    <img src={track.coverArt} alt="" />
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
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaylistModalTrack(track);
                }}
                title="Add to Playlist"
              >
                <span className="material-symbols-rounded">playlist_add</span>
              </button>
            </div>
            );
          })}
        </div>
      );
    }
    
    if (libraryActiveTab === 'Albums') {
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

    if (libraryActiveTab === 'Artists') {
      const allArtists = artists || [];
      const filteredArtists = artistSearch.trim()
        ? allArtists.filter(a => a.name.toLowerCase().includes(artistSearch.toLowerCase()))
        : allArtists;

      return (
        <div className="playlists-container">
          <div className="playlists-toolbar">
            <div style={{ flex: 1 }}></div>
            {allArtists.length > 0 && (
              <div className="playlist-search-field">
                <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>search</span>
                <input
                  type="text"
                  className="playlist-name-input"
                  placeholder="Search artists..."
                  value={artistSearch}
                  onChange={e => setArtistSearch(e.target.value)}
                  autoComplete="off"
                />
                {artistSearch && (
                  <button className="icon-btn" onClick={() => setArtistSearch('')} style={{ padding: '4px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {allArtists.length === 0 ? (
            renderEmpty('Artists', 'person')
          ) : filteredArtists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: '8px' }}>search_off</span>
              No artists matching "{artistSearch}"
            </div>
          ) : (
            <div className="playlist-grid">
              {filteredArtists.map((artist, i) => (
                <div className="card" key={i} onClick={() => {
                  setSelectedArtist(artist);
                  setCurrentView('ArtistDetails');
                }}>
                  {artist.coverArt ? (
                    <img className="card-art" src={artist.coverArt} alt="Cover" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div className="card-art empty-card-art" style={{ borderRadius: '50%' }}><span className="material-symbols-rounded">person</span></div>
                  )}
                  <div className="card-title" style={{ textAlign: 'center' }}>{artist.name}</div>
                  <div className="card-subtitle" style={{ textAlign: 'center' }}>{artist.tracks.length} tracks</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (libraryActiveTab === 'Playlists') {
      const allPlaylists = library.playlists;
      const filteredPlaylists = playlistSearch.trim()
        ? allPlaylists.filter(p => p.name.toLowerCase().includes(playlistSearch.toLowerCase()))
        : allPlaylists;

      return (
        <div className="playlists-container">
          <div className="playlists-toolbar">
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '8px' }}>add</span>
              Create Playlist
            </button>

            {allPlaylists.length > 3 && (
              <div className="playlist-search-field">
                <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>search</span>
                <input
                  type="text"
                  className="playlist-name-input"
                  placeholder="Search playlists..."
                  value={playlistSearch}
                  onChange={e => setPlaylistSearch(e.target.value)}
                  autoComplete="off"
                />
                {playlistSearch && (
                  <button className="icon-btn" onClick={() => setPlaylistSearch('')} style={{ padding: '4px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {allPlaylists.length === 0 ? (
            renderEmpty('Playlists', 'queue_music')
          ) : filteredPlaylists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: '8px' }}>search_off</span>
              No playlists matching "{playlistSearch}"
            </div>
          ) : (
            <div className="playlist-grid">
              {filteredPlaylists.map((playlist, i) => (
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
                  <div className="card-subtitle">{playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (libraryActiveTab === 'History') {
      if (history.length === 0) return renderEmpty('History', 'history');
      return (
        <div className="track-list">
          {history.map((track, i) => {
            const isThisTrackPlaying = currentTrack?.id === track.id;
            return (
            <div className={`track-item ${isThisTrackPlaying ? 'playing' : ''}`} key={i} onClick={() => playTrack(track, history)}>
              <div className="track-icon queue-art" style={{ position: 'relative' }}>
                {isThisTrackPlaying && isPlaying ? (
                  <div className="playing-animation">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                ) : track.coverArt ? (
                  <img src={track.coverArt} alt="" />
                ) : (
                  <span className="material-symbols-rounded">history</span>
                )}
              </div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
            );
          })}
        </div>
      );
    }

    if (libraryActiveTab === 'Likes') {
      if (likes.length === 0) return renderEmpty('Likes', 'favorite');
      return (
        <div className="track-list">
          {likes.map((track, i) => {
            const isThisTrackPlaying = currentTrack?.id === track.id;
            return (
            <div className={`track-item ${isThisTrackPlaying ? 'playing' : ''}`} key={i} onClick={() => playTrack(track, likes)}>
              <div className="track-icon queue-art" style={{ position: 'relative' }}>
                {isThisTrackPlaying && isPlaying ? (
                  <div className="playing-animation">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                ) : track.coverArt ? (
                  <img src={track.coverArt} alt="" />
                ) : (
                  <span className="material-symbols-rounded">favorite</span>
                )}
              </div>
              <div className="track-info">
                <div className="track-name">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
            );
          })}
        </div>
      );
    }

    return renderEmpty(libraryActiveTab, libraryActiveTab === 'Playlists' ? 'queue_music' : 'help');
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

  const handleCreatePlaylist = async (name) => {
    try {
      await createPlaylistFolder(name);
      const lib = await loadLibrary();
      setLibrary(lib.singles, lib.albums, lib.playlists);
      addToast('Playlist created!', 'success');
    } catch (e) {
      addToast('Failed to create playlist', 'error');
    }
    setShowCreateModal(false);
  };

  return (
    <div className="library-view" style={{ overflowX: 'hidden' }}>
      <FolderBanner />

      <div className="library-subnav">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`subnav-btn ${libraryActiveTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="library-content" style={{ position: 'relative' }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={libraryActiveTab}
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
                <h2>{libraryActiveTab}</h2>
              </div>
              {renderContent()}
            </section>
          </motion.div>
        </AnimatePresence>
      </div>

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
      />
    </div>
  );
};

export default LibraryView;
