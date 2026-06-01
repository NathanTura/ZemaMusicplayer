import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles, loadLibrary } from './FileSystem';

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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

export async function startDownload(track, backendUrl = DEFAULT_BACKEND_URL) {
  const query = buildQuery(track);
  const title = getDownloadTitle(track);
  const artist = track.artist || track.artistName || '';

  const id = Math.random().toString(36).substr(2, 9);
  const downloadObj = {
    id,
    query,
    title,
    artist,
    status: 'downloading',
    progress: 0,
    total: 0,
    speed: 0,
    percent: 0,
    eta: 0
  };

  usePlayerStore.getState().addDownloadObject(downloadObj);

  try {
    usePlayerStore.getState().updateDownload(id, 'downloading');
    const res = await fetch(`${backendUrl}/download?query=${encodeURIComponent(query)}`);
    
    if (!res.ok) {
      const errorMessage = await res.text();
      throw new Error(errorMessage || 'Download failed');
    }

    const blob = await res.blob();
    const safeName = `${title} - ${artist}.mp3`;
    await saveCompletedFile(blob, safeName);
    usePlayerStore.getState().updateDownload(id, 'completed');
  } catch (error) {
    console.error('Download failed', error);
    usePlayerStore.getState().updateDownload(id, 'failed');
    throw error;
  }

  return id;
}

export async function pauseDownload(id) {
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

export async function cancelDownload(id) {
  usePlayerStore.getState().removeDownload(id);
}

export default { startDownload, pauseDownload, resumeDownload, cancelDownload };
