import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Loading Screen Logic
  const loadingScreen = document.getElementById('loading-screen');
  const appContent = document.getElementById('app');

  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      appContent.style.display = 'flex';
    }, 500);
  }, 1500); // 1.5 second loading screen


  // Folder selection logic (for Local Music)
  const loadFolderBtn = document.getElementById('load-folder-btn');
  const folderInput = document.getElementById('folder-input');

  if (loadFolderBtn && folderInput) {
    loadFolderBtn.addEventListener('click', () => {
      folderInput.click();
    });

    folderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      const audioFiles = files.filter(file => file.type.startsWith('audio/'));
      
      if (audioFiles.length > 0) {
        document.getElementById('local-status').innerHTML = `<p style="margin-top:16px; color:#009E60;">Loaded ${audioFiles.length} local tracks.</p>`;
      } else {
        alert('No audio files found in selected folder.');
      }
    });
  }
});

// Mobile Now Playing Toggle
window.toggleMobileNowPlaying = function() {
  const overlay = document.getElementById('mobile-now-playing');
  if (overlay.classList.contains('open')) {
    overlay.classList.remove('open');
  } else {
    overlay.classList.add('open');
  }
};
