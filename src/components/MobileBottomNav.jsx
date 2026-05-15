import React from 'react';

const MobileBottomNav = () => (
  <nav className="bottom-nav mobile-only">
    <button className="nav-item active">
      <span className="material-symbols-rounded">home</span>
      <span>Home</span>
    </button>
    <button className="nav-item">
      <span className="material-symbols-rounded">library_music</span>
      <span>Library</span>
    </button>
    <button className="nav-item">
      <span className="material-symbols-rounded">equalizer</span>
      <span>Equalizer</span>
    </button>
  </nav>
);

export default MobileBottomNav;
