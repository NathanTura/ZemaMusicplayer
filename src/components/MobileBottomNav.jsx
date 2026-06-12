import React from 'react';

const MobileBottomNav = ({ currentView, setCurrentView }) => (
  <nav className="bottom-nav mobile-only">
    <button className={`nav-item ${currentView === 'Home' ? 'active' : ''}`} onClick={() => setCurrentView('Home')}>
      <span className="material-symbols-rounded">home</span>
      <span>Home</span>
    </button>
    <button className={`nav-item ${currentView === 'Library' ? 'active' : ''}`} onClick={() => setCurrentView('Library')}>
      <span className="material-symbols-rounded">library_music</span>
      <span>Library</span>
    </button>
  </nav>
);

export default MobileBottomNav;
