import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const Sidebar = () => {
  const { queue, currentIndex, playTrack, desktopNowPlayingOpen, currentTrack, isPlaying } = usePlayerStore();

  return (
    <>
    {/* Right Sidebar (Desktop Only) */}
    <aside className={`sidebar desktop-only ${desktopNowPlayingOpen ? 'hidden-right' : ''}`}>
      <div className="sidebar-header">
        <h3>UP NEXT</h3>
        <button className="icon-btn" onClick={() => usePlayerStore.setState({ queue: [] })}><span className="material-symbols-rounded">delete_sweep</span></button>
      </div>
      <div className="queue-list">
         {queue.length === 0 ? (
           <div className="empty-queue">
             <span className="material-symbols-rounded">queue_music</span>
             <p>Your queue is empty</p>
             <span>Load a folder and play a song to build your queue.</span>
           </div>
         ) : (
           queue.map((track, idx) => (
             <div 
               key={track.id + '-' + idx} 
               className={`track-item ${idx === currentIndex ? 'playing' : ''}`}
               onDoubleClick={() => playTrack(track, queue)}
             >
               <div className="track-number queue-art" style={{ position: 'relative' }}>
                 {idx === currentIndex && isPlaying ? (
                  <div className="playing-animation">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                 ) : track.coverArt ? (
                   <img src={track.coverArt} alt="Cover" />
                 ) : (
                   <span className="material-symbols-rounded" style={{fontSize: '1rem'}}>music_note</span>
                 )}
               </div>
               <div className="track-info">
                 <div className="track-title" style={{ fontWeight: '600', color: idx === currentIndex ? 'var(--color-primary)' : '#fff' }}>{track.title}</div>
                 <div className="track-artist" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{track.artist} • {track.album || 'Local Audio'}</div>
               </div>
             </div>
           ))
         )}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
