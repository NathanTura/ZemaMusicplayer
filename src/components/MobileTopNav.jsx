import React, { useState } from 'react';
import usePlayerStore from '../store/usePlayerStore';

const MobileTopNav = ({ setCurrentView }) => {
  const [isSearching, setIsSearching] = useState(false);
  const { searchQuery, setSearchQuery, activeDownloads, setDownloadsModalOpen } = usePlayerStore();
  const downloadingCount = activeDownloads.filter(d => d.status === 'downloading').length;

  return (
    <header className="mobile-top-nav mobile-only">
      {!isSearching ? (
        <>
          <div className="nav-left" onClick={() => setCurrentView('Home')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img src="/logo.png" alt="Zema Logo" className="app-logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, marginLeft: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', height: '100%' }}>Zema</span>
          </div>
          <div className="mobile-top-actions">
             <button className="icon-btn" onClick={() => setIsSearching(true)}>
               <span className="material-symbols-rounded">search</span>
             </button>
             <button 
               className="icon-btn" 
               onClick={() => setDownloadsModalOpen(true)}
               style={{ position: 'relative' }}
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
        </>
      ) : (
        <div className="mobile-search-active" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px' }}>
          <button className="icon-btn" onClick={() => { setIsSearching(false); setSearchQuery(''); }}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <input 
            type="text" 
            placeholder="Search music..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
            autoFocus
          />
        </div>
      )}
    </header>
  );
};

export default MobileTopNav;
