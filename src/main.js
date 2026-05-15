import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching Logic
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active to clicked
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Folder selection logic
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
        // Show mini player for visual feedback (temporary)
        const miniPlayer = document.getElementById('mini-player');
        miniPlayer.classList.add('visible');
        
        // Change title to show loaded count
        const miniTitle = miniPlayer.querySelector('.mini-title');
        miniTitle.textContent = `Loaded ${audioFiles.length} songs`;
        
        // Update empty state text
        const songsSection = document.getElementById('songs');
        songsSection.innerHTML = `<div class="empty-state" style="height: auto; padding: 2rem 0;">
          <p>Loaded ${audioFiles.length} tracks. Metadata parsing coming in Step 3.</p>
        </div>`;
      } else {
        alert('No audio files found in selected folder.');
      }
    });
  }
});
