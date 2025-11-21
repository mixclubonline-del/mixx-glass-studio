/**
 * ALS Display Decision Engine
 * 
 * Prime Brain's decision system for when ALS Header should show text vs waveform.
 * 
 * Flow Doctrine:
 * - Prime Brain makes the decision (active)
 * - ALS Header displays what Prime Brain tells it (passive)
 * - Never clutter - only show text when information is pertinent
 * - User never breaks flow to see information
 * 
 * Decision Rules:
 * 1. Waveform is default - pure visual, no text
 * 2. Text appears only when information is:
 *    - Urgent (requires immediate attention)
 *    - Actionable (user needs to do something)
 *    - Contextual (relevant to current activity)
 *    - Time-sensitive (will be missed if not shown now)
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import type { BehaviorState } from './behaviorEngine';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';

export interface ALSDisplayDecision {
  showText: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  duration?: number; // How long to show text (ms), undefined = until condition changes
  information?: {
    mode?: string;
    guidance?: string;
    health?: string;
    warnings?: string[];
  };
}

export interface DisplayContext {
  behaviorState: BehaviorState;
  primeBrainStatus: PrimeBrainStatus | null;
  isPlaying: boolean;
  isRecording: boolean;
  hushActive: boolean;
  hasSelection: boolean;
  hasClips: boolean;
  recentUserAction: boolean;
  timeSinceLastAction: number; // ms
}

/**
 * Compute ALS display decision
 * 
 * Prime Brain decides: waveform (default) or text (when needed)
 */
export function computeALSDisplayDecision(context: DisplayContext): ALSDisplayDecision {
  const { behaviorState, primeBrainStatus, isPlaying, isRecording, hushActive, recentUserAction, timeSinceLastAction } = context;

  // Rule 1: URGENT - Always show text for urgent situations
  if (hushActive) {
    return {
      showText: true,
      priority: 'urgent',
      reason: 'hush_active',
      information: {
        warnings: ['HUSH ACTIVE - Noise detected'],
      },
    };
  }

  // Rule 2: ACTIONABLE - Show text when user needs to take action
  if (isRecording && !isPlaying) {
    return {
      showText: true,
      priority: 'high',
      reason: 'recording_ready',
      information: {
        mode: primeBrainStatus?.mode || 'record',
        guidance: 'Ready to record - click play',
      },
    };
  }

  // Rule 3: CONTEXTUAL - Show text during active playback (user is engaged)
  if (isPlaying) {
    return {
      showText: true,
      priority: 'medium',
      reason: 'playback_active',
      duration: undefined, // Show until playback stops
      information: {
        mode: primeBrainStatus?.mode || 'flow',
        guidance: primeBrainStatus?.guidanceLine || 'Playback active',
      },
    };
  }

  // Rule 4: TIME-SENSITIVE - Show text briefly after significant events
  if (recentUserAction && timeSinceLastAction < 2000) {
    // Only show if there's meaningful information
    const hasMeaningfulInfo = 
      primeBrainStatus?.guidanceLine && 
      primeBrainStatus.guidanceLine !== "Flow is standing by." &&
      primeBrainStatus.guidanceLine.length > 20;

    if (hasMeaningfulInfo) {
      return {
        showText: true,
        priority: 'low',
        reason: 'recent_action_feedback',
        duration: 2000, // Show for 2 seconds
        information: {
          guidance: primeBrainStatus.guidanceLine,
        },
      };
    }
  }

  // Rule 5: WARNINGS - Show text for important warnings
  if (behaviorState.hushWarnings.length > 0 && behaviorState.tension > 0.5) {
    return {
      showText: true,
      priority: 'high',
      reason: 'warnings_present',
      duration: 3000, // Show for 3 seconds
      information: {
        warnings: behaviorState.hushWarnings,
      },
    };
  }

  // Rule 6: MODE TRANSITIONS - Show text briefly when mode changes significantly
  if (primeBrainStatus && behaviorState.mode !== 'idle') {
    const modeRequiresAttention = ['record', 'burst', 'punch'].includes(behaviorState.mode);
    if (modeRequiresAttention && recentUserAction && timeSinceLastAction < 1000) {
      return {
        showText: true,
        priority: 'medium',
        reason: 'mode_transition',
        duration: 1500, // Show for 1.5 seconds
        information: {
          mode: primeBrainStatus.mode,
          guidance: primeBrainStatus.modeCaption,
        },
      };
    }
  }

  // Default: Waveform (no text)
  return {
    showText: false,
    priority: 'low',
    reason: 'default_waveform',
  };
}

/**
 * Find opportunities throughout the system where display decisions should be made
 * 
 * These are signals/components that should trigger display decisions:
 */
export const DISPLAY_DECISION_OPPORTUNITIES = {
  // Transport events
  TRANSPORT_PLAY: 'transport_play',
  TRANSPORT_PAUSE: 'transport_pause',
  TRANSPORT_STOP: 'transport_stop',
  TRANSPORT_RECORD: 'transport_record',

  // User actions
  CLIP_SELECTED: 'clip_selected',
  TRACK_SELECTED: 'track_selected',
  REGION_MOVED: 'region_moved',
  PARAMETER_CHANGED: 'parameter_changed',

  // System events
  HUSH_ACTIVATED: 'hush_activated',
  HUSH_DEACTIVATED: 'hush_deactivated',
  NOISE_DETECTED: 'noise_detected',
  MODE_CHANGED: 'mode_changed',

  // Audio events
  CLIP_PLAYING: 'clip_playing',
  CLIP_STOPPED: 'clip_stopped',
  MASTER_LEVEL_HIGH: 'master_level_high',
  MASTER_LEVEL_CLIPPING: 'master_level_clipping',

  // Flow events
  FLOW_HIGH: 'flow_high',
  FLOW_LOW: 'flow_low',
  CREATIVE_BURST: 'creative_burst',
  PRECISION_MODE: 'precision_mode',
} as const;

/**
 * Map system signals to display decision triggers
 */
export function mapSignalToDisplayTrigger(signal: string, payload: any): Partial<DisplayContext> | null {
  switch (signal) {
    case 'transport_event':
      return {
        isPlaying: payload.type === 'play',
        isRecording: payload.type === 'record',
        recentUserAction: true,
      };
    
    case 'hush_event':
      return {
        hushActive: payload.active,
        recentUserAction: true,
      };
    
    case 'selection_change':
      return {
        hasSelection: payload.hasSelection,
        recentUserAction: true,
      };
    
    case 'user_action':
      return {
        recentUserAction: true,
      };
    
    default:
      return null;
  }
}


