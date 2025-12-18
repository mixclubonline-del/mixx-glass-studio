/**
 * Contextual Transport Items
 * 
 * Maps each BloomContext to contextual transport controls.
 * Core AURA Philosophy: Functions are contextual in BEHAVIOR, not just name.
 */

import React from 'react';
import type { BloomContext } from '../../types/bloom';
import { BLOOM_CONTEXT_ACCENTS } from '../../types/bloom';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TransportControl {
  id: string;
  label: string;
  icon?: string; // Icon name or component
  action: string;
  enabled?: boolean;
}

export interface ContextualSeekBehavior {
  back: {
    label: string;
    action: string;
    description: string;
  };
  forward: {
    label: string;
    action: string;
    description: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Contextual Seek Behaviors
// Same buttons, different functions per context
// ═══════════════════════════════════════════════════════════════════════════

export const contextualSeekBehaviors: Record<BloomContext, ContextualSeekBehavior> = {
  arrange: {
    back: { label: 'Prev', action: 'seekToPrevMarker', description: 'Previous bar/marker' },
    forward: { label: 'Next', action: 'seekToNextMarker', description: 'Next bar/marker' },
  },
  record: {
    back: { label: 'Take', action: 'prevTake', description: 'Previous take' },
    forward: { label: 'Take', action: 'nextTake', description: 'Next take' },
  },
  mix: {
    back: { label: 'Solo', action: 'soloNextTrack:-1', description: 'Solo previous track' },
    forward: { label: 'Solo', action: 'soloNextTrack:1', description: 'Solo next track' },
  },
  master: {
    back: { label: 'Ref A', action: 'switchToRefA', description: 'A reference' },
    forward: { label: 'Ref B', action: 'switchToRefB', description: 'B reference' },
  },
  ai: {
    back: { label: 'Undo', action: 'ai:undo', description: 'Undo AI suggestion' },
    forward: { label: 'Redo', action: 'ai:redo', description: 'Redo AI suggestion' },
  },
  sampler: {
    back: { label: 'Bank', action: 'prevPadBank', description: 'Previous pad bank' },
    forward: { label: 'Bank', action: 'nextPadBank', description: 'Next pad bank' },
  },
  ingest: {
    back: { label: 'Prev', action: 'prevIngestItem', description: 'Previous import' },
    forward: { label: 'Next', action: 'nextIngestItem', description: 'Next import' },
  },
  edit: {
    back: { label: 'Edit', action: 'prevEditPoint', description: 'Previous edit point' },
    forward: { label: 'Edit', action: 'nextEditPoint', description: 'Next edit point' },
  },
  idle: {
    back: { label: 'Back', action: 'seekBack1Bar', description: 'Back 1 bar' },
    forward: { label: 'Fwd', action: 'seekForward1Bar', description: 'Forward 1 bar' },
  },
  // Mapped/Default Contexts
  recording: {
    back: { label: 'Take', action: 'prevTake', description: 'Previous take' },
    forward: { label: 'Take', action: 'nextTake', description: 'Next take' },
  },
  "recording-option": {
    back: { label: 'Back', action: 'seekBack1Bar', description: 'Back 1 bar' },
    forward: { label: 'Fwd', action: 'seekForward1Bar', description: 'Forward 1 bar' },
  },
  mixer: {
    back: { label: 'Solo', action: 'soloNextTrack:-1', description: 'Solo previous track' },
    forward: { label: 'Solo', action: 'soloNextTrack:1', description: 'Solo next track' },
  },
  system: {
    back: { label: 'Back', action: 'seekBack1Bar', description: 'Back 1 bar' },
    forward: { label: 'Fwd', action: 'seekForward1Bar', description: 'Forward 1 bar' },
  },
  "prime-brain": {
    back: { label: 'Undo', action: 'ai:undo', description: 'Undo AI suggestion' },
    forward: { label: 'Redo', action: 'ai:redo', description: 'Redo AI suggestion' },
  },
  "translation-matrix": {
    back: { label: 'Back', action: 'seekBack1Bar', description: 'Back 1 bar' },
    forward: { label: 'Fwd', action: 'seekForward1Bar', description: 'Forward 1 bar' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Contextual Transport Controls (additional controls per context)
// ═══════════════════════════════════════════════════════════════════════════

export const contextualTransportControls: Record<BloomContext, TransportControl[]> = {
  arrange: [
    { id: 'loop', label: 'Loop', action: 'toggleLoop' },
    { id: 'zoom', label: 'Zoom', action: 'zoomToSelection' },
  ],
  record: [
    { id: 'arm', label: 'Arm', action: 'armSelectedTrack' },
    { id: 'metronome', label: 'Click', action: 'toggleMetronome' },
    { id: 'countIn', label: 'Count', action: 'toggleCountIn' },
  ],
  mix: [
    { id: 'soloDefeat', label: 'Defeat', action: 'soloDefeat' },
  ],
  master: [
    { id: 'abCompare', label: 'A/B', action: 'toggleABCompare' },
    { id: 'export', label: 'Export', action: 'export:show' },
  ],
  ai: [],
  sampler: [
    { id: 'quantize', label: 'Quantize', action: 'quantizeSampler' },
  ],
  ingest: [],
  edit: [
    { id: 'undo', label: 'Undo', action: 'undo' },
    { id: 'redo', label: 'Redo', action: 'redo' },
  ],
  idle: [],
  // Mapped/Default Contexts
  recording: [
    { id: 'arm', label: 'Arm', action: 'armSelectedTrack' },
    { id: 'metronome', label: 'Click', action: 'toggleMetronome' },
  ],
  "recording-option": [],
  mixer: [
    { id: 'soloDefeat', label: 'Defeat', action: 'soloDefeat' },
  ],
  system: [],
  "prime-brain": [],
  "translation-matrix": [],
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the seek behavior for a given context and direction
 */
export function getSeekBehavior(
  context: BloomContext,
  direction: 'back' | 'forward'
): ContextualSeekBehavior['back'] {
  const behavior = contextualSeekBehaviors[context] ?? contextualSeekBehaviors.idle;
  return behavior[direction];
}

/**
 * Get additional transport controls for a given context
 */
export function getContextualControls(context: BloomContext): TransportControl[] {
  return contextualTransportControls[context] ?? [];
}

/**
 * Get the accent color for a given context
 */
export function getTransportAccent(context: BloomContext): string {
  return BLOOM_CONTEXT_ACCENTS[context] ?? BLOOM_CONTEXT_ACCENTS.idle;
}

export default contextualSeekBehaviors;
