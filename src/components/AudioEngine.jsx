import React, { useEffect, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';

function AudioEngine() {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef([]);

  const {
    currentTrack,
    isPlaying,
    setAudioElement,
    setProgress,
    setDuration,
    setIsPlaying,
    nextTrack,
    volume,
    eqEnabled,
    eqGains,
    setPreloadedLyrics,
    setPreloadedArtistInfo
  } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      setAudioElement(audioRef.current);
      
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
        
        const frequencies = [60, 230, 910, 3600, 14000];
        const filters = frequencies.map(freq => {
          const filter = ctx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });
        
        source.connect(filters[0]);
        for (let i = 0; i < filters.length - 1; i++) {
          filters[i].connect(filters[i + 1]);
        }
        filters[filters.length - 1].connect(ctx.destination);
        
        filtersRef.current = filters;
      } catch (err) {
        console.warn('Failed to initialize AudioContext (EQ unavailable):', err);
      }
    }
  }, [setAudioElement]);

  useEffect(() => {
    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, i) => {
        filter.gain.value = eqEnabled ? eqGains[i] : 0;
      });
    }
  }, [eqEnabled, eqGains]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const loadAndPlayTrack = async () => {
      if (!currentTrack) return;

      try {
        // Cleanup previous object URL (only if we created it — not for pre-built urls)
        if (objectUrlRef.current && !currentTrack.url) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        let url;

        if (currentTrack.fileHandle) {
          // Desktop: File System Access API — get file from handle
          const file = await currentTrack.fileHandle.getFile();
          url = URL.createObjectURL(file);
          objectUrlRef.current = url;
        } else if (currentTrack.url) {
          // Mobile fallback: track already has an object URL, use it directly
          url = currentTrack.url;
        } else {
          return; // No audio source available
        }

        if (audioRef.current) {
          audioRef.current.src = url;
          if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
        }
      } catch (error) {
        console.error("Error loading track audio:", error);
      }
    };

    const preloadMetadata = async () => {
      if (!currentTrack) return;
      
      setPreloadedLyrics(null, null);
      setPreloadedArtistInfo(null, null);

      const title = encodeURIComponent(currentTrack.title);
      const artist = encodeURIComponent(currentTrack.artist);

      // Preload Lyrics
      fetch(`https://lrclib.net/api/get?track_name=${title}&artist_name=${artist}`)
        .then(res => res.ok ? res.json() : Promise.reject('Not found'))
        .then(data => {
          if (data.syncedLyrics) {
            setPreloadedLyrics(data.syncedLyrics, null);
          } else if (data.plainLyrics) {
            setPreloadedLyrics(data.plainLyrics, 'plain');
          } else {
            setPreloadedLyrics(null, 'No lyrics available');
          }
        })
        .catch(() => setPreloadedLyrics(null, 'No synchronized lyrics found for this track.'));

      // Preload Artist Info
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${artist}`)
        .then(res => res.ok ? res.json() : Promise.reject('Not found'))
        .then(data => {
          if (data.type !== 'disambiguation' && data.extract) {
            setPreloadedArtistInfo({
              name: data.title,
              description: data.extract,
              image: data.thumbnail?.source || null,
              url: data.content_urls?.desktop?.page || null
            }, null);
          } else {
            throw new Error('Disambiguation');
          }
        })
        .catch(() => {
          // Fallback to iTunes
          fetch(`https://itunes.apple.com/search?term=${artist}&entity=musicArtist&limit=1`)
            .then(res => res.ok ? res.json() : Promise.reject('Not found'))
            .then(data => {
               if (data.results && data.results.length > 0) {
                 const artistInfo = data.results[0];
                 setPreloadedArtistInfo({
                   name: artistInfo.artistName,
                   description: `Genre: ${artistInfo.primaryGenreName}`,
                   image: null,
                   url: artistInfo.artistLinkUrl
                 }, null);
               } else {
                 setPreloadedArtistInfo(null, 'No online information found for this artist.');
               }
            })
            .catch(() => setPreloadedArtistInfo(null, 'No online information found for this artist.'));
        });
    };

    loadAndPlayTrack();
    preloadMetadata();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [currentTrack]); // Only reload when track changes

  // Play/Pause effect
  useEffect(() => {
    const managePlayback = async () => {
      if (audioRef.current) {
        if (isPlaying) {
          try {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            if (audioRef.current.src) {
              await audioRef.current.play();
            }
          } catch (e) {
             console.error("Play error", e);
             setIsPlaying(false);
          }
        } else {
          audioRef.current.pause();
        }
      }
    };
    managePlayback();
  }, [isPlaying, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      style={{ display: 'none' }}
    />
  );
}

export default AudioEngine;
