/**
 * Snap Helpers - Calculate snap positions and zero crossings
 */

import { GridResolution } from '@/types/timeline';

export const calculateGridSnapPositions = (
  time: number,
  zoom: number,
  resolution: GridResolution,
  bpm: number = 120
): number => {
  const secondsPerBeat = 60 / bpm;
  
  // Parse resolution
  let divisor = 4;
  let isTriplet = false;
  
  if (resolution.endsWith('T')) {
    isTriplet = true;
    divisor = parseInt(resolution.replace('/1', '').replace('T', ''));
  } else {
    divisor = parseInt(resolution.replace('/1', ''));
  }
  
  const gridSize = isTriplet 
    ? (secondsPerBeat * 4) / (divisor * 1.5) // Triplet grid
    : (secondsPerBeat * 4) / divisor; // Regular grid
  
  // Snap to nearest grid line
  return Math.round(time / gridSize) * gridSize;
};

export const findMagneticSnapTargets = (
  time: number,
  regions: Array<{ startTime: number; duration: number }>,
  threshold: number = 0.1 // seconds
): number[] => {
  const targets: number[] = [];
  
  regions.forEach(region => {
    const regionStart = region.startTime;
    const regionEnd = region.startTime + region.duration;
    
    // Check if close to start or end
    if (Math.abs(time - regionStart) < threshold) {
      targets.push(regionStart);
    }
    if (Math.abs(time - regionEnd) < threshold) {
      targets.push(regionEnd);
    }
  });
  
  return targets;
};

export const findZeroCrossing = (
  audioBuffer: AudioBuffer,
  targetTime: number,
  searchRange: number = 0.01 // 10ms search window
): number => {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  
  const targetSample = Math.floor(targetTime * sampleRate);
  const searchSamples = Math.floor(searchRange * sampleRate);
  
  let closestCrossing = targetTime;
  let minDistance = Infinity;
  
  // Search for zero crossings in window
  for (let i = Math.max(0, targetSample - searchSamples); 
       i < Math.min(channelData.length - 1, targetSample + searchSamples); 
       i++) {
    const current = channelData[i];
    const next = channelData[i + 1];
    
    // Detect zero crossing (sign change)
    if ((current >= 0 && next < 0) || (current < 0 && next >= 0)) {
      const crossingTime = i / sampleRate;
      const distance = Math.abs(crossingTime - targetTime);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCrossing = crossingTime;
      }
    }
  }
  
  return closestCrossing;
};

export const snapTimeToGrid = (
  time: number,
  snapMode: 'off' | 'grid' | 'magnetic' | 'zero-crossing',
  options: {
    resolution?: GridResolution;
    bpm?: number;
    zoom?: number;
    regions?: Array<{ startTime: number; duration: number }>;
    audioBuffer?: AudioBuffer;
  }
): number => {
  if (snapMode === 'off') return time;
  
  if (snapMode === 'grid' && options.resolution) {
    return calculateGridSnapPositions(
      time, 
      options.zoom ?? 100, 
      options.resolution, 
      options.bpm ?? 120
    );
  }
  
  if (snapMode === 'magnetic' && options.regions) {
    const targets = findMagneticSnapTargets(time, options.regions);
    if (targets.length > 0) {
      // Return closest target
      return targets.reduce((closest, target) => 
        Math.abs(target - time) < Math.abs(closest - time) ? target : closest
      );
    }
  }
  
  if (snapMode === 'zero-crossing' && options.audioBuffer) {
    return findZeroCrossing(options.audioBuffer, time);
  }
  
  return time;
};
