import React, { useState, useEffect, useRef } from 'react';
import LoadingScreen from './components/LoadingScreen';
import TopNav from './components/TopNav';
import MobileTopNav from './components/MobileTopNav';
import FolderBanner from './components/FolderBanner';
import MusicSections from './components/MusicSections';
import Sidebar from './components/Sidebar';
import DesktopPlayer from './components/DesktopPlayer';
import MobileMiniPlayer from './components/MobileMiniPlayer';
import MobileBottomNav from './components/MobileBottomNav';
import MobileNowPlaying from './components/MobileNowPlaying';

function App() {
  const [loading, setLoading] = useState(true);
  const [mobileNowPlayingOpen, setMobileNowPlayingOpen] = useState(false);
  const [localFiles, setLocalFiles] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  
  const fileInputRef = useRef(null);
  const resizerRef = useRef(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleResizerMouseDown = () => {
    isResizing.current = true;
    if (resizerRef.current) resizerRef.current.classList.add('is-resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      <LoadingScreen loading={loading} />
      
      {!loading && (
        <div id="app">
          <TopNav />
          <MobileTopNav />

          <div className="main-container">
            <main className="content">
              <FolderBanner 
                localFiles={localFiles} 
                onBrowseClick={handleFolderLoadClick}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
              />
              <MusicSections />
            </main>

            <Sidebar 
              sidebarWidth={sidebarWidth}
              resizerRef={resizerRef}
              onResizerMouseDown={handleResizerMouseDown}
            />
          </div>

          <DesktopPlayer />
          
          <MobileMiniPlayer onToggle={toggleMobileNowPlaying} />
          <MobileBottomNav />
          <MobileNowPlaying isOpen={mobileNowPlayingOpen} onToggle={toggleMobileNowPlaying} />
        </div>
      )}
    </>
  );
}

export default App;
