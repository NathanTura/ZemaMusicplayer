import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles, loadLibrary } from './FileSystem';

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const pollers = new Map();
const POLL_INTERVAL_ACTIVE = 1500; // Active download polling
const POLL_INTERVAL_SLOW = 3000;   // Queued/Processing polling

function buildQuery(track) {
  return `${track.title || track.trackName || track.name || 'Unknown'} ${track.artist || track.artistName || ''}`.trim();
}

function getDownloadTitle(track) {
  return track.title || track.trackName || track.name || 'Unknown';
}

async function saveCompletedFile(blob, filename) {
  const saved = await saveBlobToSingles(blob, filename);
  if (saved) {
    try {
      const lib = await loadLibrary();
      usePlayerStore.getState().setLibrary(lib.singles, lib.albums, lib.playlists);
    } catch (error) {
      console.error('Failed to reload library after download', error);
    }
  } else {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

function clearPoller(id) {
  const task = pollers.get(id);
  if (!task) return;
  if (task.timeoutId) {
    clearTimeout(task.timeoutId);
  }
  pollers.delete(id);
}

async function finalizeDownload(id, backendUrl, filename) {
  const task = pollers.get(id);
  if (!task) return;

  try {
    const res = await fetch(`${backendUrl}/download/file/${id}`, { signal: task.controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch completed download file');
    }

    const blob = await res.blob();
    const safeName = filename ? filename.replace(/\.[^.]+$/, '') + '.mp3' : `${getDownloadTitle(usePlayerStore.getState().activeDownloads.find(d => d.id === id) || { title: 'download' })}.mp3`;
    await saveCompletedFile(blob, safeName);
    usePlayerStore.getState().updateDownloadProgress(id, task.total || task.progress || blob.size, task.total || task.progress || blob.size);
    usePlayerStore.getState().updateDownload(id, 'completed');
  } catch (error) {
    if (task.controller.signal.aborted) {
      usePlayerStore.getState().updateDownload(id, 'paused');
    } else {
      console.error('Failed to finalize download', error);
      usePlayerStore.getState().updateDownload(id, 'failed');
    }
    throw error;
  } finally {
    clearPoller(id);
  }
}

async function pollStatus(id, backendUrl) {
  const task = pollers.get(id);
  if (!task) return;

  try {
    const res = await fetch(`${backendUrl}/download/status/${id}`, { signal: task.controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch download status');
    }

    const status = await res.json();
    const progress = status.downloaded_bytes || 0;
    const total = status.total_bytes || 0;
    const updates = {
      status: status.status,
      speed: status.speed || 0,
      eta: status.eta || 0,
      percent: status.percent || 0,
    };

    usePlayerStore.getState().updateDownloadStats(id, updates);
    usePlayerStore.getState().updateDownloadProgress(id, progress, total);

    if (status.status === 'completed') {
      await finalizeDownload(id, backendUrl, status.filename);
      return;
    }

    if (status.status === 'failed' || status.status === 'canceled') {
      usePlayerStore.getState().updateDownload(id, status.status);
      clearPoller(id);
      return;
    }

    task.total = total;
    task.progress = progress;
    // Use faster polling for active downloads, slower for queued/processing
    const interval = status.status === 'downloading' ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_SLOW;
    task.timeoutId = setTimeout(() => pollStatus(id, backendUrl), interval);
  } catch (error) {
    if (task.controller.signal.aborted) {
      return;
    }
    console.error('Download status polling error', error);
    usePlayerStore.getState().updateDownload(id, 'failed');
    clearPoller(id);
  }
}

export async function startDownload(track, backendUrl = DEFAULT_BACKEND_URL) {
  const query = buildQuery(track);
  const title = getDownloadTitle(track);
  const artist = track.artist || track.artistName || '';

  const response = await fetch(`${backendUrl}/download/start?query=${encodeURIComponent(query)}`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Failed to queue download');
  }

  const data = await response.json();
  const id = data.jobId;
  const downloadObj = {
    id,
    query,
    title,
    artist,
    status: 'queued',
    progress: 0,
    total: 0,
    speed: 0,
    percent: 0,
    eta: 0
  };

  usePlayerStore.getState().addDownloadObject(downloadObj);
  const controller = new AbortController();
  pollers.set(id, { controller, timeoutId: null, progress: 0, total: 0 });

  pollStatus(id, backendUrl);
  return id;
}

export async function pauseDownload(id, backendUrl = DEFAULT_BACKEND_URL) {
  const task = pollers.get(id);
  if (task) {
    task.controller.abort();
    if (task.timeoutId) clearTimeout(task.timeoutId);
    clearPoller(id);
  }

  try {
    await fetch(`${backendUrl}/download/cancel/${id}`, { method: 'POST' });
  } catch (error) {
    console.warn('Failed to cancel download on backend', error);
  }

  usePlayerStore.getState().updateDownload(id, 'paused');
}

export async function resumeDownload(track, backendUrl = DEFAULT_BACKEND_URL, idToReplace) {
  try {
    const newId = await startDownload(track, backendUrl);
    if (idToReplace) usePlayerStore.getState().removeDownload(idToReplace);
    return newId;
  } catch (error) {
    console.error('Resume download failed', error);
    throw error;
  }
}

export async function cancelDownload(id, backendUrl = DEFAULT_BACKEND_URL) {
  const task = pollers.get(id);
  if (task) {
    task.controller.abort();
    if (task.timeoutId) clearTimeout(task.timeoutId);
    clearPoller(id);
  }

  try {
    await fetch(`${backendUrl}/download/cancel/${id}`, { method: 'POST' });
  } catch (error) {
    console.warn('Failed to cancel download on backend', error);
  }

  usePlayerStore.getState().removeDownload(id);
}

export default { startDownload, pauseDownload, resumeDownload, cancelDownload };
