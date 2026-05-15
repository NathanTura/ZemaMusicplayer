import React from 'react';

const Sidebar = ({ sidebarWidth, resizerRef, onResizerMouseDown }) => (
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
        <button className="icon-btn"><span className="material-symbols-rounded">delete_sweep</span></button>
      </div>
      <div className="queue-list">
         <div className="empty-queue">
           <span className="material-symbols-rounded">queue_music</span>
           <p>Your queue is empty</p>
           <span>Load a folder and play a song to build your queue.</span>
         </div>
      </div>
    </aside>
  </>
);

export default Sidebar;
