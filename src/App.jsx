import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';
import TopNav from './components/TopNav';
import MobileTopNav from './components/MobileTopNav';
import HomeView from './views/HomeView';
import LibraryView from './views/LibraryView';
import EqualizerView from './views/EqualizerView';
import SearchView from './views/SearchView';
import AlbumView from './views/AlbumView';
import PlaylistView from './views/PlaylistView';
import Sidebar from './components/Sidebar';
import DesktopPlayer from './components/DesktopPlayer';
import MobileMiniPlayer from './components/MobileMiniPlayer';
import MobileBottomNav from './components/MobileBottomNav';
import MobileNowPlaying from './components/MobileNowPlaying';
import AudioEngine from './components/AudioEngine';
import Toast from './components/Toast';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import DownloadsModal from './components/DownloadsModal';
import usePlayerStore from './store/usePlayerStore';
import { checkZemaRootExists, loadLibrary } from './services/FileSystem';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('Home');
  const [mobileNowPlayingOpen, setMobileNowPlayingOpen] = useState(false);
  const [localFiles, setLocalFiles] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const { 
    setZemaRootSelected, setLibrary, rehydrateData, searchQuery, 
    selectedAlbum, selectedPlaylist, playlistModalTrack, setPlaylistModalTrack 
  } = usePlayerStore();

  const viewOrder = useMemo(() => ['Home', 'Library', 'AlbumDetails', 'PlaylistDetails', 'Equalizer'], []);
  const [direction, setDirection] = useState(0);

  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    })
  };
  const fileInputRef = useRef(null);
  const resizerRef = useRef(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      const exists = await checkZemaRootExists();
      setZemaRootSelected(exists);
      
      if (exists) {
        try {
          const { singles, albums, playlists } = await loadLibrary();
          setLibrary(singles, albums, playlists);
          await rehydrateData();
        } catch (error) {
          console.error("Error loading library:", error);
        }
      }
      
      setLoading(false);
    };

    initializeApp();
  }, [setZemaRootSelected, setLibrary, rehydrateData]);

  const handleFolderLoadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    setLocalFiles(audioFiles);
  };

  const toggleMobileNowPlaying = (e) => {
    if (e) e.stopPropagation();
    setMobileNowPlayingOpen(!mobileNowPlayingOpen);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        if (resizerRef.current) resizerRef.current.classList.remove('is-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResizerMouseDown = () => {
    isResizing.current = true;
    if (resizerRef.current) resizerRef.current.classList.add('is-resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleSetView = (view) => {
    if (view === currentView) return;
    const currentIndex = viewOrder.indexOf(view);
    const prevIndex = viewOrder.indexOf(currentView);
    setDirection(currentIndex > prevIndex ? 1 : -1);
    setCurrentView(view);
  };

  return (
    <>
      <LoadingScreen loading={loading} />
      
      {!loading && (
        <div id="app">
          <AudioEngine />
          <TopNav currentView={currentView} setCurrentView={handleSetView} />
          <MobileTopNav setCurrentView={handleSetView} />

          <div className="main-container">
            <main className="content">
              {searchQuery && searchQuery.trim().length >= 2 && isMobile ? (
                <SearchView />
              ) : (
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={currentView}
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 400, damping: 35 },
                      opacity: { duration: 0.2 }
                    }}
                    style={{ width: '100%' }}
                  >
                    {currentView === 'Home' ? (
                      <HomeView setCurrentView={handleSetView} />
                    ) : currentView === 'Library' ? (
                      <LibraryView 
                        localFiles={localFiles} 
                        onBrowseClick={handleFolderLoadClick}
                        fileInputRef={fileInputRef}
                        onFileChange={handleFileChange}
                        setCurrentView={handleSetView}
                      />
                    ) : currentView === 'AlbumDetails' ? (
                      <AlbumView setCurrentView={handleSetView} album={selectedAlbum} />
                    ) : currentView === 'PlaylistDetails' ? (
                      <PlaylistView setCurrentView={handleSetView} playlist={selectedPlaylist} />
                    ) : (
                      <EqualizerView />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </main>

            <Sidebar 
              sidebarWidth={sidebarWidth}
              resizerRef={resizerRef}
              onResizerMouseDown={handleResizerMouseDown}
            />
          </div>

          <DesktopPlayer />
          
          <MobileMiniPlayer onToggle={toggleMobileNowPlaying} />
          <MobileBottomNav currentView={currentView} setCurrentView={handleSetView} />
          <MobileNowPlaying isOpen={mobileNowPlayingOpen} onToggle={toggleMobileNowPlaying} />
          <Toast />
          <AddToPlaylistModal 
            isOpen={!!playlistModalTrack} 
            track={playlistModalTrack} 
            onClose={() => setPlaylistModalTrack(null)} 
          />
          <DownloadsModal />
        </div>
      )}
    </>
  );
}

export default App;
