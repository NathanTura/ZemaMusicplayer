import React from 'react';

const HomeView = () => (
  <div className="home-view">
    <section className="music-section">
      <div className="section-header">
        <h2>Recently Played</h2>
      </div>
      <div className="horizontal-scroll">
        <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">music_note</span></div><div className="card-title">Empty</div><div className="card-subtitle">Unknown</div></div>
        <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">music_note</span></div><div className="card-title">Empty</div><div className="card-subtitle">Unknown</div></div>
        <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">music_note</span></div><div className="card-title">Empty</div><div className="card-subtitle">Unknown</div></div>
        <div className="card desktop-only"><div className="card-art empty-card-art"><span className="material-symbols-rounded">music_note</span></div><div className="card-title">Empty</div><div className="card-subtitle">Unknown</div></div>
      </div>
    </section>

    <section className="music-section">
      <div className="section-header">
        <h2>Playlists</h2>
        <button className="see-all-btn">See All</button>
      </div>
      <div className="horizontal-scroll">
        <div className="card"><div className="card-art empty-card-art"><span className="material-symbols-rounded">queue_music</span></div><div className="card-title">No Playlists</div><div className="card-subtitle">Local Folder</div></div>
      </div>
    </section>
  </div>
);

export default HomeView;
