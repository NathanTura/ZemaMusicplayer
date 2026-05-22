import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const TopNav = ({ currentView, setCurrentView }) => {
  const { searchQuery, setSearchQuery } = usePlayerStore();
  
  return (
  <header className="top-nav desktop-only">
    <div className="nav-container-centered">
      <div className="nav-left">
        <div className="logo-wrapper" onClick={() => setCurrentView('Home')} style={{ cursor: 'pointer' }}>
          <img src="src\assets\Logo_copy.png" alt="Zema Logo" className="app-logo" />
          <span className="logo-text">Zema</span>
        </div>
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
            placeholder="Search your local music..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  </header>
  );
};

export default TopNav;
