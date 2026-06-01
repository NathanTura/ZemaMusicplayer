import React from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { pauseDownload, resumeDownload, cancelDownload } from '../services/downloadManager';

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
                <div className="download-info" style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="download-title" style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {download.title}
                  </div>
                  <div className="download-artist" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {download.artist}
                  </div>
                  {download.status === 'downloading' && download.total > 0 && (
                    <div className="download-progress-container" style={{ marginTop: '8px', width: '100%' }}>
                      <div className="download-progress-bar" style={{ 
                        height: '4px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '2px', 
                        overflow: 'hidden' 
                      }}>
                        <div 
                          className="download-progress-fill" 
                          style={{ 
                            height: '100%', 
                            background: 'var(--color-primary)', 
                            width: `${Math.min(100, Math.round((download.progress / download.total) * 100))}%`,
                            transition: 'width 0.2s linear'
                          }} 
                        />
                      </div>
                      <div className="download-progress-stats" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '11px', 
                        color: 'var(--color-text-muted)', 
                        marginTop: '6px' 
                      }}>
                        <span>
                          {download.total > 0 ? `${(download.progress / (1024 * 1024)).toFixed(2)} MB / ${(download.total / (1024 * 1024)).toFixed(2)} MB` : `${(download.progress / (1024 * 1024)).toFixed(2)} MB`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                        <span>{download.speed ? `${(download.speed / 1024).toFixed(2)} KB/s` : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="download-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {download.status === 'downloading' && (
                        <button className="icon-btn" title="Pause" onClick={() => pauseDownload(download.id)}>
                          <span className="material-symbols-rounded">pause</span>
                        </button>
                      )}
                      {download.status === 'queued' && (
                        <span className="material-symbols-rounded" style={{ color: 'var(--color-text-muted)' }}>schedule</span>
                      )}
                      {download.status === 'paused' && (
                        <button className="icon-btn" title="Resume" onClick={() => resumeDownload({ title: download.title, artist: download.artist }, import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', download.id)}>
                          <span className="material-symbols-rounded">play_arrow</span>
                        </button>
                      )}
                      {download.status === 'completed' && (
                        <span className="material-symbols-rounded" style={{ color: 'var(--color-success)' }}>check_circle</span>
                      )}
                      {download.status === 'failed' && (
                        <span className="material-symbols-rounded" style={{ color: 'var(--color-error)' }}>error</span>
                      )}
                      <button className="icon-btn remove-btn" title="Cancel/Remove" onClick={() => cancelDownload(download.id)}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                  </div>
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
