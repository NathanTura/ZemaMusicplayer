import React from 'react';

const FolderBanner = ({ localFiles, onBrowseClick, fileInputRef, onFileChange }) => (
  <div className="folder-banner">
    <div className="folder-banner-text">
      <h2>Select your music folder</h2>
      <p>Load your local MP3 files directly from your device to start listening.</p>
      <div className="status-text">
        {localFiles.length > 0 ? (
          <><span style={{ color: 'var(--color-primary)' }}>{localFiles.length} local tracks loaded.</span> Ready for playback.</>
        ) : null}
      </div>
    </div>
    <button className="btn-primary" onClick={onBrowseClick}>Browse Files</button>
    <input 
      type="file" 
      ref={fileInputRef} 
      webkitdirectory="" 
      directory="" 
      multiple 
      style={{ display: 'none' }} 
      onChange={onFileChange}
    />
  </div>
);

export default FolderBanner;
