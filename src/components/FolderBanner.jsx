import React, { useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { promptForZemaRoot, loadLibrary, importSingle, importAlbum } from '../services/FileSystem';
import * as jsmediatags from 'jsmediatags';

// Detect whether the File System Access API is available (desktop Chrome/Edge)
const supportsFileSystemAPI = typeof window.showDirectoryPicker === 'function';

function readTagsFromFile(file) {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => resolve(tag.tags),
      onError: () => resolve(null),
    });
  });
}



const FolderBanner = () => {
  const { zemaRootSelected, setZemaRootSelected, setLibrary, singles, albums, addToast } = usePlayerStore();
  const mobileInputRef = useRef(null);

  // ── Desktop (File System Access API) handlers ──

  const handleSetup = async () => {
    const root = await promptForZemaRoot();
    if (root) {
      setZemaRootSelected(true);
      const { singles, albums, playlists } = await loadLibrary();
      setLibrary(singles, albums, playlists);
    }
  };

  const handleImportSingle = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Audio Files', accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] } }]
      });
      await importSingle(fileHandle);
      const { singles, albums, playlists } = await loadLibrary();
      setLibrary(singles, albums, playlists);
    } catch (e) {
      console.log('Single import cancelled or failed');
    }
  };

  const handleImportAlbum = async () => {
    try {
      const folderHandle = await window.showDirectoryPicker();
      await importAlbum(folderHandle);
      const { singles, albums, playlists } = await loadLibrary();
      setLibrary(singles, albums, playlists);
    } catch (e) {
      console.log('Album import cancelled or failed');
    }
  };

  // ── Mobile fallback handler ──

  const handleMobileFileChange = async (e) => {
    const files = Array.from(e.target.files).filter(
      f => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac)$/i.test(f.name)
    );
    if (files.length === 0) return;

    addToast(`Loading ${files.length} track${files.length > 1 ? 's' : ''}...`, 'loading');
    
    // Process and persist files
    for (const file of files) {
      // Save it directly using our new fallback function!
      await import('../services/FileSystem').then(m => m.saveBlobToSingles(file, file.name));
    }

    // Reload library to get the updated mobile singles
    const { singles: newSingles, albums: newAlbums, playlists: newPlaylists } = await loadLibrary();
    setLibrary(newSingles, newAlbums, newPlaylists);
    
    // Mark root as "selected" so the banner flips to the ready state
    setZemaRootSelected(true);
    addToast(`Added ${files.length} track${files.length > 1 ? 's' : ''}!`, 'success');

    // Reset input so same files can be picked again
    e.target.value = '';
  };

  // ── Render ──

  if (!supportsFileSystemAPI) {
    // Mobile / unsupported browser — show simple file picker
    return (
      <div className="folder-banner">
        <div className="folder-banner-text">
          <h2>Add Music</h2>
          <p>
            Tap below to pick audio files from your device.
            {singles.length > 0 && (
              <span style={{ color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>
                {singles.length} track{singles.length !== 1 ? 's' : ''} loaded
              </span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => mobileInputRef.current?.click()}>
          Add Audio Files
        </button>
        <input
          ref={mobileInputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
          multiple
          style={{ display: 'none' }}
          onChange={handleMobileFileChange}
        />
      </div>
    );
  }

  // Desktop — original folder-picker flow
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
