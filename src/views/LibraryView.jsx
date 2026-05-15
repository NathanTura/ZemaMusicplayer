import React, { useState } from 'react';
import FolderBanner from '../components/FolderBanner';

const LibraryView = ({ localFiles, onBrowseClick, fileInputRef, onFileChange }) => {
  const [activeTab, setActiveTab] = useState('History');

  return (
    <div className="library-view">
      <FolderBanner 
        localFiles={localFiles} 
        onBrowseClick={onBrowseClick}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
      />

      <div className="library-subnav">
        {['History', 'Likes', 'Playlists', 'Albums'].map(tab => (
          <button 
            key={tab}
            className={`subnav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="library-content">
        <section className="music-section">
          <div className="section-header">
            <h2>{activeTab}</h2>
          </div>
          <div className="horizontal-scroll">
            <div className="card">
              <div className="card-art empty-card-art">
                <span className="material-symbols-rounded">
                  {activeTab === 'Likes' ? 'favorite' : 
                   activeTab === 'Albums' ? 'album' : 
                   activeTab === 'History' ? 'history' : 'queue_music'}
                </span>
              </div>
              <div className="card-title">Empty {activeTab}</div>
              <div className="card-subtitle">No items found</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LibraryView;
