import React from 'react';
import usePlayerStore from '../store/usePlayerStore';
import SearchDropdown from './SearchDropdown';

const TopNav = ({ currentView, setCurrentView }) => {
  const { searchQuery, setSearchQuery, activeDownloads, setDownloadsModalOpen } = usePlayerStore();
  
  const downloadingCount = activeDownloads.filter(d => d.status === 'downloading').length;
  
  return (
  <header className="top-nav desktop-only">
    <div className="nav-container-centered">
      <div className="nav-left">
        {/* <div className="logo-wrapper" onClick={() => setCurrentView('Home')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="Zema Logo" className="app-logo" />
          <span className="logo-text">Zema</span>
        </div> */}
        <nav className="nav-links">
          <a href="#" className={currentView === 'Home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('Home'); }}>Home</a>
          <a href="#" className={currentView === 'Library' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('Library'); }}>Library</a>
          <a href="#" className={currentView === 'Equalizer' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('Equalizer'); }}>Equalizer</a>
        </nav>
      </div>
      
      <div className="nav-center">
        <div className="nav-search">
          <span className="material-symbols-rounded">search</span>
          <input 
            type="text" 
            placeholder="Search music..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
        <SearchDropdown />
      </div>
      
      <div className="nav-right">
        <button 
          className="icon-btn" 
          onClick={() => setDownloadsModalOpen(true)}
          style={{ position: 'relative' }}
          title="Downloads"
        >
          <span className="material-symbols-rounded">download</span>
          {downloadingCount > 0 && (
            <span style={{
              position: 'absolute', top: '0px', right: '0px', 
              background: 'var(--color-primary)', color: '#000', 
              fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {downloadingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>
  );
};

export default TopNav;
