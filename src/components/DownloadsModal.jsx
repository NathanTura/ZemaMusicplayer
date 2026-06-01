import React from 'react';
import usePlayerStore from '../store/usePlayerStore';

const DownloadsModal = () => {
  const { activeDownloads, downloadsModalOpen, setDownloadsModalOpen, removeDownload } = usePlayerStore();

  if (!downloadsModalOpen) return null;

  return (
    <div className="downloads-modal-overlay" onClick={() => setDownloadsModalOpen(false)}>
      <div className="downloads-modal" onClick={e => e.stopPropagation()}>
        <div className="downloads-modal-header">
          <h3>Downloads</h3>
          <button className="icon-btn" onClick={() => setDownloadsModalOpen(false)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        <div className="downloads-list">
          {activeDownloads.length === 0 ? (
            <div className="empty-downloads">
              <span className="material-symbols-rounded" style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '8px' }}>downloading</span>
              <p>No music is downloading</p>
            </div>
          ) : (
            activeDownloads.map((download) => (
              <div key={download.id} className={`download-item status-${download.status}`}>
                <div className="download-info">
                  <div className="download-title">{download.title}</div>
                  <div className="download-artist">{download.artist}</div>
                </div>
                <div className="download-status">
                  {download.status === 'downloading' && (
                    <div className="spinner-small"></div>
                  )}
                  {download.status === 'completed' && (
                    <span className="material-symbols-rounded" style={{ color: 'var(--color-success)' }}>check_circle</span>
                  )}
                  {download.status === 'failed' && (
                    <span className="material-symbols-rounded" style={{ color: 'var(--color-error)' }}>error</span>
                  )}
                  {download.status !== 'downloading' && (
                    <button className="icon-btn remove-btn" onClick={() => removeDownload(download.id)}>
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadsModal;
