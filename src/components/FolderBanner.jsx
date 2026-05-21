import React from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { promptForZemaRoot, loadLibrary, importSingle, importAlbum } from '../services/FileSystem';

const FolderBanner = () => {
  const { zemaRootSelected, setZemaRootSelected, setLibrary, singles, albums } = usePlayerStore();

  const handleSetup = async () => {
    const root = await promptForZemaRoot();
    if (root) {
      setZemaRootSelected(true);
      const { singles, albums } = await loadLibrary();
      setLibrary(singles, albums);
    }
  };

  const handleImportSingle = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Audio Files', accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] } }]
      });
      await importSingle(fileHandle);
      const { singles, albums } = await loadLibrary();
      setLibrary(singles, albums);
    } catch(e) {
      console.log('Single import cancelled or failed');
    }
  };

  const handleImportAlbum = async () => {
    try {
      const folderHandle = await window.showDirectoryPicker();
      await importAlbum(folderHandle);
      const { singles, albums } = await loadLibrary();
      setLibrary(singles, albums);
    } catch (e) {
      console.log('Album import cancelled or failed');
    }
  };

  if (!zemaRootSelected) {
    return (
      <div className="folder-banner">
        <div className="folder-banner-text">
          <h2>Setup Zema Library</h2>
          <p>Select a folder on your computer to be the home for all your Zema music.</p>
        </div>
        <button className="btn-primary" onClick={handleSetup}>Select Zema Folder</button>
      </div>
    );
  }

  return (
    <div className="folder-banner">
      <div className="folder-banner-text">
        <h2>Your Library is Ready</h2>
        <p>Import music into your Zema folder to start listening.</p>
        <div className="status-text">
          <span style={{ color: 'var(--color-primary)' }}>{singles.length} Singles, {albums.length} Albums</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={handleImportSingle}>Import Single</button>
        <button className="btn-primary" onClick={handleImportAlbum}>Import Album</button>
      </div>
    </div>
  );
};

export default FolderBanner;
