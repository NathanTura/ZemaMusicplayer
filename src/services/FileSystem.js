import { get, set } from 'idb-keyval';
import * as jsmediatags from 'jsmediatags';

function readTags(file) {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: function(tag) {
        resolve(tag.tags);
      },
      onError: function(error) {
        resolve(null);
      }
    });
  });
}

async function fetchWebMetadata(query, localTitle, localArtist) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const localTitleWords = localTitle.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      const localArtistWords = localArtist !== 'Unknown Artist' ? localArtist.toLowerCase().split(/\W+/).filter(w => w.length > 2) : [];
      
      let bestMatch = null;
      let highestScore = -1;

      for (const track of data.results) {
        const trackNameLow = track.trackName.toLowerCase();
        const artistNameLow = track.artistName.toLowerCase();
        
        let titleScore = 0;
        let artistScore = 0;
        
        localTitleWords.forEach(w => { if (trackNameLow.includes(w)) titleScore += 1; });
        localArtistWords.forEach(w => { if (artistNameLow.includes(w)) artistScore += 1; });
        
        // CRITICAL: If the title doesn't match AT ALL, it's the wrong song!
        if (titleScore === 0 && localTitleWords.length > 0) continue;

        let totalScore = (titleScore * 3) + artistScore;
        
        if (totalScore > highestScore) {
          highestScore = totalScore;
          bestMatch = track;
        }
      }

      // If no valid match was found that shared at least one word of the title
      if (!bestMatch) {
         return null; 
      }

      return {
        title: bestMatch.trackName,
        artist: bestMatch.artistName,
        coverArt: bestMatch.artworkUrl100 ? bestMatch.artworkUrl100.replace('100x100bb', '600x600bb') : null
      };
    }
  } catch(e) {
    console.warn("Web search error or timeout for", query);
  }
  return null;
}

const ZEMA_ROOT_KEY = 'zema_root_dir_handle';

/**
 * Ensures a directory exists, returning its handle.
 */
async function ensureDirectory(parentHandle, dirName) {
  return await parentHandle.getDirectoryHandle(dirName, { create: true });
}

/**
 * Prompts user to select the Zema root directory and saves it.
 */
export async function promptForZemaRoot() {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'music',
      id: 'zema_root'
    });
    
    // Ensure basic structure exists
    await ensureDirectory(dirHandle, 'Singles');
    await ensureDirectory(dirHandle, 'Albums');
    await ensureDirectory(dirHandle, 'Playlists');

    await set(ZEMA_ROOT_KEY, dirHandle);
    return dirHandle;
  } catch (error) {
    console.error('Error selecting Zema root:', error);
    return null;
  }
}

/**
 * Checks if Zema root is saved in IndexedDB without requesting permission
 */
export async function checkZemaRootExists() {
  const dirHandle = await get(ZEMA_ROOT_KEY);
  return !!dirHandle;
}

/**
 * Gets the Zema root directory handle from IndexedDB and verifies permission.
 */
export async function getZemaRoot() {
  const dirHandle = await get(ZEMA_ROOT_KEY);
  if (!dirHandle) return null;

  try {
    // Verify permission
    const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const request = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (request !== 'granted') return null;
    }
    return dirHandle;
  } catch (error) {
    console.error('Error verifying permissions:', error);
    return null;
  }
}

/**
 * Helper to copy a file handle to a destination directory handle
 */
async function copyFileToDir(fileHandle, destDirHandle) {
  const file = await fileHandle.getFile();
  const newFileHandle = await destDirHandle.getFileHandle(fileHandle.name, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return newFileHandle;
}

/**
 * Imports a single file to the Singles folder
 */
export async function importSingle(fileHandle) {
  const root = await getZemaRoot();
  if (!root) throw new Error("Zema root not set");
  const singlesDir = await ensureDirectory(root, 'Singles');
  return await copyFileToDir(fileHandle, singlesDir);
}

/**
 * Saves a raw Blob to the Singles folder (or IndexedDB on mobile)
 */
export async function saveBlobToSingles(blob, filename) {
  const root = await getZemaRoot();
  if (!root) {
    // Mobile fallback: save blob to IndexedDB
    try {
      const mobileSingles = await get('zema_mobile_singles') || [];
      const newTrack = await buildMobileTrackFromBlob(blob, filename);
      
      // Avoid exact duplicates
      const exists = mobileSingles.find(t => t.id === newTrack.id);
      if (!exists) {
        mobileSingles.push(newTrack);
        await set('zema_mobile_singles', mobileSingles);
      }
      return true; // Successfully saved internally!
    } catch (e) {
      console.error('Error saving to mobile IndexedDB', e);
      // Fallback to browser download if IDB fails
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return false;
    }
  }
  
  const singlesDir = await ensureDirectory(root, 'Singles');
  const newFileHandle = await singlesDir.getFileHandle(filename, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

/**
 * Saves a raw Blob to a specific Album folder
 */
export async function saveBlobToAlbum(blob, albumFolderName, filename) {
  const root = await getZemaRoot();
  if (!root) {
    // Mobile fallback: reuse saveBlobToSingles for now
    return await saveBlobToSingles(blob, filename);
  }
  
  const albumsDir = await ensureDirectory(root, 'Albums');
  // Clean up album folder name to avoid invalid characters
  const safeFolderName = albumFolderName.replace(/[<>:"/\\|?*]+/g, '_');
  const targetAlbumDir = await ensureDirectory(albumsDir, safeFolderName);
  const newFileHandle = await targetAlbumDir.getFileHandle(filename, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

/**
 * Helper to build track object from raw Blob/File for mobile IDB
 */
export async function buildMobileTrackFromBlob(blob, filename) {
  let title = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  let artist = 'Unknown Artist';
  let coverArtBlob = null;

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  try {
    const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
    const tags = await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => resolve(tag.tags),
        onError: () => resolve(null),
      });
    });

    if (tags) {
      if (tags.title) title = tags.title;
      if (tags.artist) artist = tags.artist;
      if (tags.picture) {
        coverArtBlob = new Blob([new Uint8Array(tags.picture.data)], { type: tags.picture.format });
      }
    }
  } catch (e) {
    console.error("Error reading tags for mobile track", e);
  }

  return {
    id: `mobile_${filename}_${Date.now()}`,
    title,
    artist,
    coverArtBlob,
    audioBlob: blob,
    path: filename,
  };
}

/**
 * Recursively copies a folder (Album) to the Albums folder
 */
export async function importAlbum(sourceDirHandle) {
  const root = await getZemaRoot();
  if (!root) throw new Error("Zema root not set");
  
  const albumsDir = await ensureDirectory(root, 'Albums');
  const targetAlbumDir = await ensureDirectory(albumsDir, sourceDirHandle.name);

  async function copyDirContents(srcHandle, destHandle) {
    for await (const entry of srcHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a') || file.name.endsWith('.wav')) {
           const newFileHandle = await destHandle.getFileHandle(entry.name, { create: true });
           const writable = await newFileHandle.createWritable();
           await writable.write(file);
           await writable.close();
        } else if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
           // Maybe copy cover art too
           const newFileHandle = await destHandle.getFileHandle(entry.name, { create: true });
           const writable = await newFileHandle.createWritable();
           await writable.write(file);
           await writable.close();
        }
      } else if (entry.kind === 'directory') {
        const newSubDir = await ensureDirectory(destHandle, entry.name);
        await copyDirContents(entry, newSubDir);
      }
    }
  }

  await copyDirContents(sourceDirHandle, targetAlbumDir);
  return targetAlbumDir;
}

/**
 * Creates a new JSON playlist
 */
export async function createPlaylistFolder(name) {
  const root = await getZemaRoot();
  if (!root) throw new Error("Zema root not set");
  const playlistsDir = await ensureDirectory(root, 'Playlists');
  const newFileHandle = await playlistsDir.getFileHandle(`${name}.json`, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(JSON.stringify([]));
  await writable.close();
  return true;
}

/**
 * Adds a track path to a JSON playlist
 */
export async function addTrackToPlaylistFolder(playlistName, trackPath) {
  const root = await getZemaRoot();
  if (!root) throw new Error("Zema root not set");
  const playlistsDir = await ensureDirectory(root, 'Playlists');
  const playlistFile = await playlistsDir.getFileHandle(`${playlistName}.json`, { create: true });
  
  const file = await playlistFile.getFile();
  let tracks = [];
  if (file.size > 0) {
    const text = await file.text();
    try { tracks = JSON.parse(text); } catch (e) { console.error(e); }
  }
  
  if (!tracks.includes(trackPath)) {
    tracks.push(trackPath);
  }
  
  const writable = await playlistFile.createWritable();
  await writable.write(JSON.stringify(tracks, null, 2));
  await writable.close();
  return true;
}

/**
 * Removes a track from a JSON playlist
 */
export async function removeTrackFromPlaylistFolder(playlistName, trackPath) {
  const root = await getZemaRoot();
  if (!root) throw new Error("Zema root not set");
  const playlistsDir = await ensureDirectory(root, 'Playlists');
  const playlistFile = await playlistsDir.getFileHandle(`${playlistName}.json`, { create: true });
  
  const file = await playlistFile.getFile();
  let tracks = [];
  if (file.size > 0) {
    const text = await file.text();
    try { tracks = JSON.parse(text); } catch (e) { console.error(e); }
  }
  
  tracks = tracks.filter(p => p !== trackPath);
  
  const writable = await playlistFile.createWritable();
  await writable.write(JSON.stringify(tracks, null, 2));
  await writable.close();
  return true;
}

/**
 * Gets all audio tracks from a specific directory handle
 */
async function getAudioFilesInDir(dirHandle, pathPrefix = '') {
  const tracks = [];
  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        if (entry.name.endsWith('.mp3') || entry.name.endsWith('.m4a') || entry.name.endsWith('.wav') || entry.name.endsWith('.ogg') || entry.name.endsWith('.flac')) {
          let title = entry.name.replace(/\.[^/.]+$/, "");
          // Clean up filename: replace underscores with spaces
          title = title.replace(/_/g, ' ');

          let artist = 'Unknown Artist';
          let coverArt = null;
          let file = null;

          // Parse "Artist - Title" from filename if it exists
          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          // Strip things like "(Official Audio)" or "[128k]" to improve search
          title = title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();

          // Strip common garbage words that mess up iTunes search
          const garbageRegex = /official audio|official video|music video|lyric video|lyrics|audio|video/gi;
          title = title.replace(garbageRegex, '').trim();

          // 1. Read local ID3 tags first
          try {
            file = await entry.getFile();
            const tags = await readTags(file);
            if (tags) {
              if (tags.title) title = tags.title;
              if (tags.artist) artist = tags.artist;
              if (tags.picture) {
                const blob = new Blob([new Uint8Array(tags.picture.data)], { type: tags.picture.format });
                coverArt = URL.createObjectURL(blob);
              }
            }
          } catch(e) {
            console.error("Tag read error", e);
          }

          // 2. Fetch from iTunes API using ID3 title (and artist if available)
          const searchQuery = artist !== 'Unknown Artist' ? `${title} ${artist}` : title;
          const webMeta = await fetchWebMetadata(searchQuery, title, artist);
          
          if (webMeta) {
            // Merge metadata: favor iTunes title and high-res cover art.
            title = webMeta.title || title;
            artist = webMeta.artist || artist;
            coverArt = webMeta.coverArt || coverArt;
          }

          tracks.push({
            id: `${pathPrefix}/${entry.name}`,
            title,
            artist,
            coverArt,
            fileHandle: entry,
            path: `${pathPrefix}/${entry.name}`
          });
        }
      } else if (entry.kind === 'directory') {
        const subTracks = await getAudioFilesInDir(entry, `${pathPrefix}/${entry.name}`);
        tracks.push(...subTracks);
      }
    }
  } catch(e) {
    console.error("Error reading dir", e);
  }
  return tracks;
}

/**
 * Loads all tracks from Zema library
 */
export async function loadLibrary() {
  let mobileSinglesTracks = [];
  try {
    const mobileSingles = await get('zema_mobile_singles') || [];
    mobileSinglesTracks = mobileSingles.map(t => ({
      ...t,
      coverArt: t.coverArtBlob ? URL.createObjectURL(t.coverArtBlob) : null,
      url: t.audioBlob ? URL.createObjectURL(t.audioBlob) : null,
    }));
  } catch (e) {
    console.error("Error loading mobile singles", e);
  }

  const root = await getZemaRoot();
  if (!root) {
    return { singles: mobileSinglesTracks, albums: [], playlists: [] };
  }

  const tracks = [];
  const singlesDir = await ensureDirectory(root, 'Singles');
  const albumsDir = await ensureDirectory(root, 'Albums');

  const singles = await getAudioFilesInDir(singlesDir, 'Singles');
  
  const albums = [];
  for await (const entry of albumsDir.values()) {
    if (entry.kind === 'directory') {
      const albumTracks = await getAudioFilesInDir(entry, `Albums/${entry.name}`);
      if (albumTracks.length > 0) {
        albums.push({
          name: entry.name,
          handle: entry,
          tracks: albumTracks
        });
      }
    }
  }

  const allLoadedTracks = [...singles];
  albums.forEach(a => allLoadedTracks.push(...a.tracks));

  const playlistsDir = await ensureDirectory(root, 'Playlists');
  const playlists = [];
  for await (const entry of playlistsDir.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      const name = entry.name.replace('.json', '');
      try {
        const file = await entry.getFile();
        const text = await file.text();
        const trackPaths = JSON.parse(text);
        
        // Map paths to loaded tracks
        const playlistTracks = trackPaths
          .map(path => allLoadedTracks.find(t => t.path === path))
          .filter(Boolean); // Remove nulls if a file was deleted

        playlists.push({
          name: name,
          handle: entry,
          tracks: playlistTracks
        });
      } catch (e) {
        console.error("Error reading playlist", name, e);
      }
    } else if (entry.kind === 'directory') {
      // Migrate old folder playlists (best effort, without writing new JSON right now to avoid loops, just read them)
      const playlistTracks = await getAudioFilesInDir(entry, `Playlists/${entry.name}`);
      if (playlistTracks.length > 0) {
        playlists.push({
          name: entry.name,
          handle: entry,
          tracks: playlistTracks,
          isLegacyFolder: true
        });
      }
    }
  }

  return { singles, albums, playlists };
}
