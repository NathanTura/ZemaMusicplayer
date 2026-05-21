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
    eqGains
  } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      setAudioElement(audioRef.current);
      
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
      if (!currentTrack || !currentTrack.fileHandle) return;

      try {
        // Cleanup previous URL
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        const file = await currentTrack.fileHandle.getFile();
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;

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

    loadAndPlayTrack();

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
      crossOrigin="anonymous"
      style={{ display: 'none' }}
    />
  );
}

export default AudioEngine;
