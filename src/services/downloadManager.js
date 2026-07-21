import usePlayerStore from '../store/usePlayerStore';
import { saveBlobToSingles, saveBlobToAlbum, loadLibrary } from './FileSystem';

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function buildQuery(track) {
  return `${track.title || track.trackName || track.name || 'Unknown'} ${track.artist || track.artistName || ''}`.trim();
}

function getDownloadTitle(track) {
  return track.title || track.trackName || track.name || 'Unknown';
}

async function saveCompletedFile(blob, filename, albumName, artistName) {
  let saved = false;
  if (albumName) {
    const folderName = `${artistName} - ${albumName}`;
    saved = await saveBlobToAlbum(blob, folderName, filename);
  } else {
    saved = await saveBlobToSingles(blob, filename);
  }
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

export async function startDownload(track, backendUrl = DEFAULT_BACKEND_URL, options = {}) {
  const query = buildQuery(track);
  const title = getDownloadTitle(track);
  const artist = track.artist || track.artistName || '';
  const albumName = options.albumName || null;

  const id = Math.random().toString(36).substr(2, 9);
  const downloadObj = {
    id,
    query,
    title,
    artist,
    albumName,
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
    
    // Start polling progress
    const progressInterval = setInterval(async () => {
      try {
        const pRes = await fetch(`${backendUrl}/progress/${id}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.status === 'downloading') {
            usePlayerStore.getState().updateDownloadStats(id, {
              percent: pData.percent || 0,
              // We'll show ETA text in progress bar or toast if needed, 
              // for now we map percent to progress/total so the UI shows it.
              progress: pData.percent,
              total: 100, 
            });
          } else if (pData.status === 'processing') {
            usePlayerStore.getState().updateDownloadStats(id, {
              percent: 100, progress: 100, total: 100
            });
          }
        }
      } catch (e) {}
    }, 1000);

    const res = await fetch(`${backendUrl}/download?query=${encodeURIComponent(query)}&client_id=${id}`);
    
    clearInterval(progressInterval);

    if (!res.ok) {
      const errorMessage = await res.text();
      throw new Error(errorMessage || 'Download failed');
    }

    const blob = await res.blob();
    const safeName = `${artist} - ${title}.mp3`.replace(/[<>:"/\\|?*]+/g, '_');
    await saveCompletedFile(blob, safeName, albumName, artist);
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

export async function downloadAlbumSequential(tracks, isDownloadedFn, backendUrl = DEFAULT_BACKEND_URL, albumName = null) {
  for (const track of tracks) {
    const isDownloaded = isDownloadedFn ? isDownloadedFn(track.trackName) : false;
    const isDownloading = usePlayerStore.getState().activeDownloads.some(d => d.title.toLowerCase() === track.trackName.toLowerCase() && d.status === 'downloading');
    
    if (!isDownloaded && !isDownloading) {
      try {
        await startDownload({
          title: track.trackName,
          artist: track.artistName
        }, backendUrl, { albumName });
      } catch (e) {
        console.error(`Failed to download ${track.trackName}`, e);
      }
    }
  }
}

export default { startDownload, pauseDownload, resumeDownload, cancelDownload, downloadAlbumSequential };
