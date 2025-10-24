/**
 * Transport Engine - Syncs to Master Clock
 */

import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { masterClock } from '@/studio/core/MasterClock';

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

  const lastBeatRef = useRef<number>(-1);

  // Sync master clock with timeline store
  useEffect(() => {
    masterClock.setLoop(loopEnabled, loopStart, loopEnd);
  }, [loopEnabled, loopStart, loopEnd]);

  // Subscribe to master clock updates
  useEffect(() => {
    if (!isPlaying) {
      masterClock.pause();
      return;
    }

    masterClock.start(currentTime);

    const unsubscribe = masterClock.subscribe((time, deltaTime) => {
      setCurrentTime(time);
      onTick?.(deltaTime);

      // Beat tick
      const beatsPerSecond = bpm / 60;
      const currentBeat = Math.floor(time * beatsPerSecond);
      if (currentBeat !== lastBeatRef.current) {
        lastBeatRef.current = currentBeat;
        onBeatTick?.(currentBeat);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isPlaying, currentTime, bpm, setCurrentTime, onTick, onBeatTick]);

  return null; // No visual output, just logic
};
