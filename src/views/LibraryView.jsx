import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FolderBanner from '../components/FolderBanner';

const LibraryView = ({ localFiles, onBrowseClick, fileInputRef, onFileChange }) => {
  const tabs = useMemo(() => ['History', 'Likes', 'Playlists', 'Albums'], []);
  const [activeTab, setActiveTab] = useState('History');
  const [direction, setDirection] = useState(0);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    const currentIndex = tabs.indexOf(tab);
    const prevIndex = tabs.indexOf(activeTab);
    setDirection(currentIndex > prevIndex ? 1 : -1);
    setActiveTab(tab);
  };

  const tabVariants = {
    initial: (direction) => ({
      x: direction > 0 ? '50px' : '-50px',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? '-50px' : '50px',
      opacity: 0
    })
  };

  return (
    <div className="library-view" style={{ overflowX: 'hidden' }}>
      <FolderBanner 
        localFiles={localFiles} 
        onBrowseClick={onBrowseClick}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
      />

      <div className="library-subnav">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`subnav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="library-content" style={{ position: 'relative' }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 }
            }}
          >
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LibraryView;
