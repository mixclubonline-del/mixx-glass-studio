/**
 * Comping System
 * 
 * Manages comping sessions for recording multiple takes and selecting the best parts.
 * Connects to the region system to create comp lanes and manage takes.
 */

import type { ArrangeClip } from '../hooks/useArrange';
import { recordHistory } from './history';

export interface CompingTake {
  id: string;
  clipId: string;
  startTime: number;
  duration: number;
  sourceStart: number;
  bufferId: string;
  selected: boolean; // Whether this take is active in the comp
  timestamp: number; // When this take was recorded
  metadata?: {
    level?: number;
    transient?: boolean;
    lufs?: number;
    [key: string]: unknown;
  };
}

export interface CompingSession {
  id: string;
  trackId: string;
  regionId: string; // The original region this comping session is for
  startTime: number;
  duration: number;
  takes: CompingTake[];
  activeTakeIds: Set<string>; // Which takes are currently active
  createdAt: number;
  updatedAt: number;
}

const compingSessions = new Map<string, CompingSession>();

/**
 * Create a new comping session for a region
 */
export function createCompingSession(
  trackId: string,
  regionId: string,
  startTime: number,
  duration: number
): CompingSession {
  const sessionId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  const session: CompingSession = {
    id: sessionId,
    trackId,
    regionId,
    startTime,
    duration,
    takes: [],
    activeTakeIds: new Set(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  compingSessions.set(sessionId, session);
  
  // Record history
  recordHistory({
    type: 'comping-session-create',
    sessionId,
    trackId,
    regionId,
  });
  
  return session;
}

/**
 * Add a take to a comping session
 */
export function addTakeToCompingSession(
  sessionId: string,
  take: Omit<CompingTake, 'id' | 'selected' | 'timestamp'>
): CompingTake | null {
  const session = compingSessions.get(sessionId);
  if (!session) return null;
  
  const takeId = `take-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const newTake: CompingTake = {
    ...take,
    id: takeId,
    selected: false,
    timestamp: Date.now(),
  };
  
  session.takes.push(newTake);
  session.updatedAt = Date.now();
  
  // Record history
  recordHistory({
    type: 'comping-take-add',
    sessionId,
    takeId: newTake.id,
  });
  
  return newTake;
}

/**
 * Toggle a take's selection in the comp
 */
export function toggleTakeSelection(sessionId: string, takeId: string): boolean {
  const session = compingSessions.get(sessionId);
  if (!session) return false;
  
  const take = session.takes.find(t => t.id === takeId);
  if (!take) return false;
  
  const wasSelected = take.selected;
  take.selected = !take.selected;
  
  if (take.selected) {
    session.activeTakeIds.add(takeId);
  } else {
    session.activeTakeIds.delete(takeId);
  }
  
  session.updatedAt = Date.now();
  
  // Record history
  recordHistory({
    type: 'comping-take-select',
    sessionId,
    takeId,
    wasSelected,
  });
  
  return take.selected;
}

/**
 * Get the active comp for a region (the selected takes combined)
 */
export function getActiveComp(sessionId: string): CompingTake[] {
  const session = compingSessions.get(sessionId);
  if (!session) return [];
  
  return session.takes
    .filter(take => session.activeTakeIds.has(take.id))
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Generate clips from active comp takes
 * This creates the final comped region from selected takes
 */
export function generateCompClips(sessionId: string): ArrangeClip[] {
  const session = compingSessions.get(sessionId);
  if (!session) return [];
  
  const activeTakes = getActiveComp(sessionId);
  if (activeTakes.length === 0) return [];
  
  // Sort takes by start time
  const sortedTakes = [...activeTakes].sort((a, b) => a.startTime - b.startTime);
  
  // Generate clips for each active take
  return sortedTakes.map((take, index) => ({
    id: `comp-clip-${sessionId}-${take.id}`,
    trackId: session.trackId,
    name: `Comp ${index + 1}`,
    color: 'cyan',
    start: take.startTime,
    duration: take.duration,
    sourceStart: take.sourceStart,
    bufferId: take.bufferId,
    selected: false,
    sourceJobId: null,
    sourceFileName: null,
    sourceFingerprint: null,
    lastIngestAt: take.timestamp,
  }));
}

/**
 * Get comping session by ID
 */
export function getCompingSession(sessionId: string): CompingSession | null {
  return compingSessions.get(sessionId) ?? null;
}

/**
 * Get comping session for a region
 */
export function getCompingSessionForRegion(regionId: string): CompingSession | null {
  for (const session of compingSessions.values()) {
    if (session.regionId === regionId) {
      return session;
    }
  }
  return null;
}

/**
 * Delete a comping session
 */
export function deleteCompingSession(sessionId: string): boolean {
  return compingSessions.delete(sessionId);
}

/**
 * Get all comping sessions for a track
 */
export function getCompingSessionsForTrack(trackId: string): CompingSession[] {
  return Array.from(compingSessions.values()).filter(session => session.trackId === trackId);
}

/**
 * Clear all comping sessions (useful for cleanup)
 */
export function clearAllCompingSessions(): void {
  compingSessions.clear();
}

