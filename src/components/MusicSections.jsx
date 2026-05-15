import React from 'react';

const MusicSections = () => (
  <>
    <section className="music-section">
      <div className="section-header">
        <h2>Recently Played</h2>
      </div>
      <div className="horizontal-scroll">
        <div className="card empty-card"><span className="material-symbols-rounded">music_note</span><div className="card-title">Empty</div></div>
        <div className="card empty-card"><span className="material-symbols-rounded">music_note</span><div className="card-title">Empty</div></div>
        <div className="card empty-card"><span className="material-symbols-rounded">music_note</span><div className="card-title">Empty</div></div>
        <div className="card empty-card desktop-only"><span className="material-symbols-rounded">music_note</span><div className="card-title">Empty</div></div>
      </div>
    </section>

    <section className="music-section">
      <div className="section-header">
        <h2>Albums</h2>
        <button className="see-all-btn">See All</button>
      </div>
      <div className="horizontal-scroll">
        <div className="card empty-card"><span className="material-symbols-rounded">album</span><div className="card-title">No Albums</div></div>
      </div>
    </section>

    <section className="music-section">
      <div className="section-header">
        <h2>Artists</h2>
        <button className="see-all-btn">See All</button>
      </div>
      <div className="horizontal-scroll">
        <div className="card empty-card round-art"><span className="material-symbols-rounded">person</span><div className="card-title">No Artists</div></div>
      </div>
    </section>
  </>
);

export default MusicSections;
