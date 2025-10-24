/**
 * Transport Engine - Syncs to Prime Brain (Master Clock)
 */

import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { primeBrain } from '@/ai/primeBrain';

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

  // Sync Prime Brain clock with timeline store
  useEffect(() => {
    primeBrain.setLoop(loopEnabled, loopStart, loopEnd);
  }, [loopEnabled, loopStart, loopEnd]);

  // Subscribe to Prime Brain clock updates
  useEffect(() => {
    if (!isPlaying) {
      primeBrain.pause();
      return;
    }

    primeBrain.start(currentTime);

    const unsubscribe = primeBrain.subscribe((time, deltaTime) => {
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
