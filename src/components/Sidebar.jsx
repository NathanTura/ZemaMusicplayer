import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const Sidebar = ({ sidebarWidth, resizerRef, onResizerMouseDown }) => {
  const { queue, currentIndex, playTrack } = usePlayerStore();

  return (
    <>
    {/* Sidebar Resizer */}
    <div 
      id="sidebar-resizer" 
      className="desktop-only" 
      ref={resizerRef}
      onMouseDown={onResizerMouseDown}
    ></div>

    {/* Right Sidebar (Desktop Only) */}
    <aside className="sidebar desktop-only" style={{ width: sidebarWidth }}>
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
               <div className="track-number">{idx === currentIndex ? <span className="material-symbols-rounded" style={{fontSize: '1rem'}}>volume_up</span> : idx + 1}</div>
               <div className="track-info">
                 <div className="track-title">{track.title}</div>
                 <div className="track-artist">{track.artist}</div>
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
