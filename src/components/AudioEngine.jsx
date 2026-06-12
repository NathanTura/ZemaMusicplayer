import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capgo/capacitor-native-audio';
import usePlayerStore from '../store/usePlayerStore';

const isNative = Capacitor.isNativePlatform();

function AudioEngine() {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const intervalRef = useRef(null);

  const {
    currentTrack,
    isPlaying,
    setAudioElement,
    setProgress,
    setDuration,
    setIsPlaying,
    nextTrack,
    volume,
    setPreloadedLyrics,
    setPreloadedArtistInfo
  } = usePlayerStore();

  // Handle native "complete" event for next track
  useEffect(() => {
    if (isNative) {
      const listener = NativeAudio.addListener('complete', () => {
        nextTrack();
      });
      return () => {
        listener.then(l => l.remove());
      };
    }
  }, [nextTrack]);

  // Pass HTML Audio element to store for Web/Desktop
  useEffect(() => {
    if (!isNative && audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  useEffect(() => {
    if (!isNative && audioRef.current) {
      audioRef.current.volume = volume;
    } else if (isNative) {
      NativeAudio.setVolume({ assetId: 'current', volume: volume }).catch(() => {});
    }
  }, [volume]);

  useEffect(() => {
    const loadAndPlayTrack = async () => {
      if (!currentTrack) return;

      try {
        if (objectUrlRef.current && !currentTrack.url) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        let url = currentTrack.url;

        // Native File Handling (Desktop PWA)
        if (currentTrack.fileHandle && !url) {
          const file = await currentTrack.fileHandle.getFile();
          url = URL.createObjectURL(file);
          objectUrlRef.current = url;
        }

        if (!url) return;

        if (isNative) {
          // Cleanup previous
          await NativeAudio.unload({ assetId: 'current' }).catch(() => {});
          
          await NativeAudio.preload({
            assetId: 'current',
            assetPath: url,
            audioChannelNum: 1,
            isUrl: true
          });

          const dur = await NativeAudio.getDuration({ assetId: 'current' });
          setDuration(dur.duration);
          
          if (isPlaying) {
            await NativeAudio.play({ assetId: 'current' });
          }
        } else {
          // Web Audio
          if (audioRef.current) {
            audioRef.current.src = url;
            if (isPlaying) {
              audioRef.current.play().catch(e => console.error("Playback failed", e));
            }
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
        .catch(() => setPreloadedLyrics(null, 'No synchronized lyrics found.'));

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
                 setPreloadedArtistInfo(null, 'No online info found.');
               }
            })
            .catch(() => setPreloadedArtistInfo(null, 'No online info found.'));
        });
    };

    loadAndPlayTrack();
    preloadMetadata();

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [currentTrack]);

  // Manage Playback state (Play/Pause)
  useEffect(() => {
    const managePlayback = async () => {
      try {
        if (isNative) {
          if (isPlaying) {
            await NativeAudio.play({ assetId: 'current' }).catch(() => {});
          } else {
            await NativeAudio.pause({ assetId: 'current' }).catch(() => {});
          }
        } else {
          if (audioRef.current) {
            if (isPlaying) {
              await audioRef.current.play().catch(e => {
                console.error("Play error", e);
                setIsPlaying(false);
              });
            } else {
              audioRef.current.pause();
            }
          }
        }
      } catch (err) {}
    };
    managePlayback();
  }, [isPlaying, setIsPlaying]);

  // Polling for Native Progress updates
  useEffect(() => {
    if (isNative) {
      if (isPlaying) {
        intervalRef.current = setInterval(async () => {
          try {
            const time = await NativeAudio.getCurrentTime({ assetId: 'current' });
            setProgress(time.currentTime);
          } catch (e) {}
        }, 500);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPlaying, setProgress]);

  // HTML Audio Events for Web/Desktop
  const handleTimeUpdate = () => {
    if (!isNative && audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (!isNative && audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (!isNative) nextTrack();
  };

  if (isNative) return null;

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
