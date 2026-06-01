import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles, loadLibrary } from './FileSystem';

const controllers = new Map();

function now() { return Date.now(); }

export async function startDownload(track, backendUrl) {
  const id = Date.now().toString();
  const downloadObj = {
    id,
    title: track.title || track.trackName || track.name || 'Unknown',
    artist: track.artist || track.artistName || '',
    status: 'downloading',
    progress: 0,
    total: 0,
    speed: 0
  };

  usePlayerStore.getState().addDownloadObject(downloadObj);

  const controller = new AbortController();
  controllers.set(id, controller);

  try {
    const res = await fetch(`${backendUrl}/download?query=${encodeURIComponent(downloadObj.title + ' ' + downloadObj.artist)}`, { signal: controller.signal });
    if (!res.ok) throw new Error('Download failed');

    const contentLength = res.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    usePlayerStore.getState().updateDownloadProgress(id, 0, total);

    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;

    let lastTime = now();
    let lastReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      const t = now();
      const dt = (t - lastTime) / 1000;
      if (dt >= 0.5) {
        const bytes = received - lastReceived;
        const speed = Math.round(bytes / dt); // bytes/sec
        usePlayerStore.getState().updateDownloadProgress(id, received, total || received);
        usePlayerStore.getState().updateDownload(id, 'downloading');
        // attach speed by updating object map directly
        usePlayerStore.setState((state) => ({
          activeDownloads: state.activeDownloads.map(d => d.id === id ? { ...d, speed } : d)
        }));
        lastTime = t;
        lastReceived = received;
      } else {
        usePlayerStore.getState().updateDownloadProgress(id, received, total || received);
      }
    }

    // finalize
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    const filename = `${downloadObj.artist ? (downloadObj.artist + ' - ') : ''}${downloadObj.title}.mp3`;

    // Try saving to Zema root; fallback to browser download
    try {
      const saved = await saveBlobToSingles(blob, filename);
      if (saved) {
        // reload library
        import('./FileSystem').then(m => m.loadLibrary().then(lib => {
          usePlayerStore.getState().setLibrary(lib.singles, lib.albums, lib.playlists);
        })).catch(console.error);
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
    } catch (e) {
      // fallback to browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    usePlayerStore.getState().updateDownloadProgress(id, received, received);
    usePlayerStore.getState().updateDownload(id, 'completed');
    controllers.delete(id);
    return id;
  } catch (e) {
    if (controller.signal.aborted) {
      // aborted: mark paused
      usePlayerStore.getState().updateDownload(id, 'paused');
    } else {
      usePlayerStore.getState().updateDownload(id, 'failed');
    }
    controllers.delete(id);
    console.error('Download error', e);
    throw e;
  }
}

export function pauseDownload(id) {
  const c = controllers.get(id);
  if (c) {
    c.abort();
    // controller removed by startDownload catch
  }
  usePlayerStore.getState().updateDownload(id, 'paused');
}

export async function resumeDownload(track, backendUrl, idToReplace) {
  // when resuming we simply start a new download and remove the old one when replaced
  try {
    const newId = await startDownload(track, backendUrl);
    // remove old entry
    if (idToReplace) usePlayerStore.getState().removeDownload(idToReplace);
    return newId;
  } catch (e) {
    throw e;
  }
}

export function cancelDownload(id) {
  const c = controllers.get(id);
  if (c) c.abort();
  usePlayerStore.getState().removeDownload(id);
  controllers.delete(id);
}

export default { startDownload, pauseDownload, resumeDownload, cancelDownload };
