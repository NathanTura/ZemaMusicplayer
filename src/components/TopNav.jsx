import React from 'react';

const TopNav = () => (
  <header className="top-nav desktop-only">
    <div className="nav-container-centered">
      <div className="nav-left">
        <div className="logo-wrapper">
          <img src="/Logo_copy.png" alt="Zema Logo" className="app-logo" />
          <span className="logo-text">Zema</span>
        </div>
        <nav className="nav-links">
          <a href="#" className="active">Home</a>
          <a href="#">Library</a>
          <a href="#">Equalizer</a>
        </nav>
      </div>
      
      <div className="nav-center">
        <div className="nav-search">
          <span className="material-symbols-rounded">search</span>
          <input type="text" placeholder="Search your local music..." />
        </div>
      </div>
      
      <div className="nav-right">
        <button className="icon-btn"><span className="material-symbols-rounded">settings</span></button>
      </div>
    </div>
  </header>
);

export default TopNav;
