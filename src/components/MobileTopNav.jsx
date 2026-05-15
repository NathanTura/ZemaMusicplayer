import React from 'react';

const MobileTopNav = () => (
  <header className="mobile-top-nav mobile-only">
    <div className="nav-left" style={{ display: 'flex', alignItems: 'center' }}>
      <img src="src\assets\Logo_copy.png" alt="Zema Logo" className="app-logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
      <span style={{ fontWeight: 700, marginLeft: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', height: '100%' }}>Zema</span>
    </div>
    <div className="mobile-top-actions">
       <button className="icon-btn"><span className="material-symbols-rounded">search</span></button>
    </div>
  </header>
);

export default MobileTopNav;
