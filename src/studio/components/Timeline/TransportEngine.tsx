/**
 * Transport Engine - Handles playback, recording, and transport state
 */

import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

interface TransportEngineProps {
  onTick?: (deltaTime: number) => void;
  onBeatTick?: (beat: number) => void;
  bpm: number;
}

export const TransportEngine: React.FC<TransportEngineProps> = ({
  onTick,
  onBeatTick,
  bpm,
}) => {
  const {
    isPlaying,
    currentTime,
    setCurrentTime,
    loopEnabled,
    loopStart,
    loopEnd,
  } = useTimelineStore();

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastBeatRef = useRef<number>(-1);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const deltaMs = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const deltaSec = deltaMs / 1000;

      // Calculate new time
      let newTime = currentTime + deltaSec;

      // Handle loop
      if (loopEnabled && loopEnd > loopStart) {
        if (newTime >= loopEnd) {
          newTime = loopStart + (newTime - loopEnd);
        }
      }

      // Update time
      setCurrentTime(newTime);
      onTick?.(deltaSec);

      // Beat tick
      const beatsPerSecond = bpm / 60;
      const currentBeat = Math.floor(newTime * beatsPerSecond);
      if (currentBeat !== lastBeatRef.current) {
        lastBeatRef.current = currentBeat;
        onBeatTick?.(currentBeat);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, currentTime, loopEnabled, loopStart, loopEnd, bpm, setCurrentTime, onTick, onBeatTick]);

  return null; // No visual output, just logic
};
