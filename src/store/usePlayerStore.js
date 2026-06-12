import { create } from 'zustand';
import { get as getIDB, set as setIDB } from 'idb-keyval';

const usePlayerStore = create((set, get) => ({
  // Library State
  zemaRootSelected: false,
  singles: [],
  albums: [],
  playlists: [],
  library: { singles: [], albums: [], playlists: [] },
  history: [],
  likes: [],
  selectedAlbum: null,
  selectedPlaylist: null,
  playlistModalTrack: null,
  searchQuery: '',
  toasts: [],
  activeDownloads: [],
  downloadsModalOpen: false,
  desktopNowPlayingOpen: false,
  libraryActiveTab: 'Singles',
  
  // Playback State
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  
  // Preloaded track metadata
  preloadedLyrics: null,
  preloadedLyricsError: null,
  preloadedArtistInfo: null,
  preloadedArtistError: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 1,
  
  // Playback Modes
  isShuffle: false,
  repeatMode: 'off', // 'off', 'all', 'one'

  // Audio Engine triggers
  audioElement: null,

  setZemaRootSelected: (status) => set({ zemaRootSelected: status }),
  setLibrary: (singles, albums, playlists) => set({ singles, albums, playlists, library: { singles, albums, playlists } }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAlbum: (album) => set({ selectedAlbum: album }),
  setSelectedPlaylist: (playlist) => set({ selectedPlaylist: playlist }),
  setPlaylistModalTrack: (track) => set({ playlistModalTrack: track }),
  setLibraryActiveTab: (tab) => set({ libraryActiveTab: tab }),
  
  addToast: (message, type = 'info') => set((state) => {
    const id = Date.now().toString();
    setTimeout(() => {
      usePlayerStore.getState().removeToast(id);
    }, 3000);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  setAudioElement: (audio) => set({ audioElement: audio }),
  
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  cycleRepeat: () => set((state) => {
    const modes = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),
  
  playTrack: (track, newQueue = null) => set((state) => {
    let queue = newQueue || state.queue;
    if (!newQueue && state.queue.length === 0) {
      queue = [track];
    }
    
    // If the track is already playing, restart it
    if (state.currentTrack && state.currentTrack.id === track.id) {
      if (state.audioElement) {
        state.audioElement.currentTime = 0;
        state.audioElement.play().catch(e => console.error(e));
      }
      return { isPlaying: true, queue, currentIndex: queue.findIndex(t => t.id === track.id) };
    }
    
    // Update history
    const historyWithoutTrack = state.history.filter(t => t.id !== track.id);
    const newHistory = [track, ...historyWithoutTrack].slice(0, 50); // Keep last 50
    setIDB('zema_history', newHistory.map(t => t.id)).catch(console.error);

    const index = queue.findIndex(t => t.id === track.id);
    return {
      currentTrack: track,
      queue,
      history: newHistory,
      currentIndex: index !== -1 ? index : 0,
      isPlaying: true
    };
  }),

  togglePlay: () => set((state) => {
    if (!state.currentTrack) return state;
    return { isPlaying: !state.isPlaying };
  }),

  toggleLike: (track) => set((state) => {
    const isLiked = state.likes.some(t => t.id === track.id);
    let newLikes;
    if (isLiked) {
      newLikes = state.likes.filter(t => t.id !== track.id);
    } else {
      newLikes = [track, ...state.likes];
    }
    setIDB('zema_likes', newLikes.map(t => t.id)).catch(console.error);
    return { likes: newLikes };
  }),

  rehydrateData: async () => {
    try {
      const { singles, albums } = get();
      const allTracks = [...singles];
      albums.forEach(a => allTracks.push(...a.tracks));
      
      const historyIds = await getIDB('zema_history') || [];
      const likesIds = await getIDB('zema_likes') || [];
      
      const hydratedHistory = historyIds.map(id => allTracks.find(t => t.id === id)).filter(Boolean);
      const hydratedLikes = likesIds.map(id => allTracks.find(t => t.id === id)).filter(Boolean);
      
      const updates = { history: hydratedHistory, likes: hydratedLikes };
      
      // Load last played track on startup
      if (hydratedHistory.length > 0 && !get().currentTrack) {
        updates.currentTrack = hydratedHistory[0];
        updates.queue = hydratedHistory;
        updates.currentIndex = 0;
        updates.isPlaying = false;
      }
      
      set(updates);
    } catch (e) {
      console.error("Failed to rehydrate data", e);
    }
  },

  nextTrack: () => set((state) => {
    if (state.queue.length === 0 || state.currentIndex === -1) return state;
    if (state.repeatMode === 'one') {
      if (state.audioElement) state.audioElement.currentTime = 0;
      return { isPlaying: true };
    }
    
    let nextIndex;
    if (state.isShuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return { isPlaying: false, progress: 0 };
        }
      }
    }
    
    const nextTrackObj = state.queue[nextIndex];
    const historyWithoutTrack = state.history.filter(t => t.id !== nextTrackObj.id);
    const newHistory = [nextTrackObj, ...historyWithoutTrack].slice(0, 50);
    setIDB('zema_history', newHistory.map(t => t.id)).catch(console.error);

    return {
      currentIndex: nextIndex,
      currentTrack: nextTrackObj,
      history: newHistory,
      isPlaying: true
    };
  }),

  prevTrack: () => set((state) => {
    if (state.queue.length === 0 || state.currentIndex === -1) return state;
    // If progress > 3 seconds, usually prev just restarts the track
    if (state.progress > 3) {
      if (state.audioElement) state.audioElement.currentTime = 0;
      return state;
    }
    const prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
    const prevTrackObj = state.queue[prevIndex];
    const historyWithoutTrack = state.history.filter(t => t.id !== prevTrackObj.id);
    const newHistory = [prevTrackObj, ...historyWithoutTrack].slice(0, 50);
    setIDB('zema_history', newHistory.map(t => t.id)).catch(console.error);

    return {
      currentIndex: prevIndex,
      currentTrack: prevTrackObj,
      history: newHistory,
      isPlaying: true
    };
  }),

  seek: (time) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.currentTime = time;
    }
    set({ progress: time });
  },

  setVolume: (level) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.volume = level;
    }
    set({ volume: level });
  },

  // State updaters for Audio Engine
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setDownloadsModalOpen: (isOpen) => set({ downloadsModalOpen: isOpen }),
  setDesktopNowPlayingOpen: (isOpen) => set({ desktopNowPlayingOpen: isOpen }),
  
  addDownload: (track) => set((state) => {
    const newDownload = { ...track, id: Date.now().toString(), status: 'downloading', progress: 0, total: 0 };
    return { 
      activeDownloads: [newDownload, ...state.activeDownloads],
      downloadsModalOpen: false // Auto-open when starting a download
    };
  }),
  // Add a download object (caller provides id)
  addDownloadObject: (downloadObj) => set((state) => ({
    activeDownloads: [downloadObj, ...state.activeDownloads],
    downloadsModalOpen: false
  })),

  updateDownload: (id, status) => set((state) => {
    return {
      activeDownloads: state.activeDownloads.map(d => d.id === id ? { ...d, status } : d)
    };
  }),

  updateDownloadProgress: (id, progress, total) => set((state) => {
    return {
      activeDownloads: state.activeDownloads.map(d => d.id === id ? { ...d, progress, total } : d)
    };
  }),

  updateDownloadStats: (id, updates) => set((state) => {
    return {
      activeDownloads: state.activeDownloads.map(d => d.id === id ? { ...d, ...updates } : d)
    };
  }),

  setPreloadedLyrics: (lyrics, error) => set({ preloadedLyrics: lyrics, preloadedLyricsError: error }),
  setPreloadedArtistInfo: (info, error) => set({ preloadedArtistInfo: info, preloadedArtistError: error }),

  removeDownload: (id) => set((state) => {
    return {
      activeDownloads: state.activeDownloads.filter(d => d.id !== id)
    };
  })
}));

export default usePlayerStore;
