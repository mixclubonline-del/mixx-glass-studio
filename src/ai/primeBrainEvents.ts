/**
 * Prime Brain Event Registration
 * 
 * Normalizes DAW-level events for Prime Brain training and orchestration.
 * All events are ALS-safe (no raw filenames or user-identifying text).
 */

export type PrimeBrainEventType =
  | 'transport-play'
  | 'transport-stop'
  | 'transport-pause'
  | 'transport-loop-toggle'
  | 'transport-seek'
  | 'tool-change'
  | 'bloom-action'
  | 'ingest-start'
  | 'ingest-complete'
  | 'track-arm'
  | 'track-disarm'
  | 'hush-toggle'
  | 'clip-create'
  | 'clip-move'
  | 'clip-resize'
  | 'clip-split'
  | 'clip-merge'
  | 'clip-delete'
  | 'automation-point-add'
  | 'automation-point-update'
  | 'automation-point-delete'
  | 'plugin-add'
  | 'plugin-remove'
  | 'plugin-parameter-change'
  | 'view-switch'
  | 'routing-rebuild'
  | 'routing-track-connect'
  | 'routing-track-disconnect'
  | 'error';

export interface PrimeBrainEvent {
  type: PrimeBrainEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
  outcome?: 'success' | 'failure' | 'cancelled';
}

type EventCallback = (event: PrimeBrainEvent) => void;

let eventCallbacks: Set<EventCallback> = new Set();

/**
 * Register a callback to receive Prime Brain events.
 * Returns an unsubscribe function.
 */
export function subscribeToPrimeBrainEvents(callback: EventCallback): () => void {
  eventCallbacks.add(callback);
  return () => {
    eventCallbacks.delete(callback);
  };
}

/**
 * Record a Prime Brain event.
 * Events are broadcast to all registered callbacks (e.g., App.tsx for userMemory).
 */
export function recordPrimeBrainEvent(
  type: PrimeBrainEventType,
  payload?: Record<string, unknown>,
  outcome?: 'success' | 'failure' | 'cancelled'
): void {
  const event: PrimeBrainEvent = {
    type,
    timestamp: new Date().toISOString(),
    payload: payload ? sanitizeEventPayload(payload) : undefined,
    outcome,
  };

  // Broadcast to all subscribers
  eventCallbacks.forEach((callback) => {
    try {
      callback(event);
    } catch (error) {
      console.warn('[PrimeBrain] Event callback error', error);
    }
  });
}

/**
 * Sanitize event payload to remove any user-identifying information.
 * Uses neutral descriptors and IDs only.
 */
function sanitizeEventPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    // Skip raw filenames or paths
    if (key.toLowerCase().includes('filename') || key.toLowerCase().includes('path')) {
      continue;
    }
    
    // Convert strings to neutral descriptors
    if (typeof value === 'string') {
      // Keep IDs and technical terms, but redact user content
      if (value.match(/^[a-z0-9-]+$/i) || value.length < 20) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[redacted]';
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

