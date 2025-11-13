/**
 * History Management System
 * 
 * Provides undo/redo functionality for DAW operations.
 * Tracks operations as immutable snapshots for reliable state restoration.
 */

export type HistoryOperation = 
  | { type: 'clip-move'; clipIds: string[]; oldPositions: Array<{ id: string; start: number; trackId: string }>; newPositions: Array<{ id: string; start: number; trackId: string }> }
  | { type: 'clip-resize'; clipIds: string[]; oldDurations: Array<{ id: string; duration: number }>; newDurations: Array<{ id: string; duration: number }> }
  | { type: 'clip-split'; clipId: string; splitTime: number; newClipIds: string[] }
  | { type: 'clip-merge'; clipIds: string[]; mergedClipId: string }
  | { type: 'clip-create'; clipIds: string[] }
  | { type: 'clip-delete'; clips: Array<{ id: string; trackId: string; start: number; duration: number; [key: string]: unknown }> }
  | { type: 'clip-property'; clipId: string; property: string; oldValue: unknown; newValue: unknown }
  | { type: 'track-create'; trackId: string }
  | { type: 'track-delete'; track: { id: string; name: string; [key: string]: unknown } }
  | { type: 'plugin-add'; trackId: string; pluginId: string; slot: number }
  | { type: 'plugin-remove'; trackId: string; pluginId: string; slot: number }
  | { type: 'plugin-parameter'; trackId: string; pluginId: string; parameter: string; oldValue: number; newValue: number }
  | { type: 'automation-point'; trackId: string; parameter: string; time: number; oldValue: number | null; newValue: number | null }
  | { type: 'comping-session-create'; sessionId: string; trackId: string; regionId: string }
  | { type: 'comping-take-add'; sessionId: string; takeId: string }
  | { type: 'comping-take-select'; sessionId: string; takeId: string; wasSelected: boolean }
  | { type: 'selection'; oldSelection: { start: number; end: number } | null; newSelection: { start: number; end: number } | null }
  | { type: 'custom'; id: string; undo: () => void; redo: () => void };

export interface HistoryState {
  past: HistoryOperation[];
  present: HistoryOperation | null;
  future: HistoryOperation[];
  maxSize: number;
}

class HistoryManager {
  private state: HistoryState = {
    past: [],
    present: null,
    future: [],
    maxSize: 100, // Maximum undo/redo stack size
  };

  /**
   * Record an operation for undo/redo tracking
   */
  record(operation: HistoryOperation): void {
    // Clear future when recording a new operation (can't redo after new action)
    this.state.future = [];
    
    // If there's a present operation, move it to past
    if (this.state.present) {
      this.state.past.push(this.state.present);
      
      // Limit past size
      if (this.state.past.length > this.state.maxSize) {
        this.state.past.shift();
      }
    }
    
    this.state.present = operation;
  }

  /**
   * Undo the last operation
   * Returns the operation that was undone, or null if nothing to undo
   */
  undo(): HistoryOperation | null {
    if (!this.state.present && this.state.past.length === 0) {
      return null;
    }

    // Move present to future
    if (this.state.present) {
      this.state.future.unshift(this.state.present);
      this.state.present = null;
    }

    // Pop from past to present
    if (this.state.past.length > 0) {
      this.state.present = this.state.past.pop() ?? null;
    }

    return this.state.present;
  }

  /**
   * Redo the last undone operation
   * Returns the operation that was redone, or null if nothing to redo
   */
  redo(): HistoryOperation | null {
    if (this.state.future.length === 0) {
      return null;
    }

    // Move present to past
    if (this.state.present) {
      this.state.past.push(this.state.present);
    }

    // Pop from future to present
    this.state.present = this.state.future.shift() ?? null;

    return this.state.present;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.present !== null || this.state.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.state = {
      past: [],
      present: null,
      future: [],
      maxSize: this.state.maxSize,
    };
  }

  /**
   * Get current history state (for debugging)
   */
  getState(): Readonly<HistoryState> {
    return {
      past: [...this.state.past],
      present: this.state.present,
      future: [...this.state.future],
      maxSize: this.state.maxSize,
    };
  }

  /**
   * Set maximum history size
   */
  setMaxSize(size: number): void {
    this.state.maxSize = Math.max(1, size);
    // Trim past if needed
    while (this.state.past.length > this.state.maxSize) {
      this.state.past.shift();
    }
  }
}

// Singleton instance
const historyManager = new HistoryManager();

/**
 * Record a history operation
 */
export const recordHistory = (operation: HistoryOperation): void => {
  historyManager.record(operation);
};

/**
 * Undo the last operation
 */
export const undoHistory = (): HistoryOperation | null => {
  return historyManager.undo();
};

/**
 * Redo the last undone operation
 */
export const redoHistory = (): HistoryOperation | null => {
  return historyManager.redo();
};

/**
 * Check if undo is available
 */
export const canUndo = (): boolean => {
  return historyManager.canUndo();
};

/**
 * Check if redo is available
 */
export const canRedo = (): boolean => {
  return historyManager.canRedo();
};

/**
 * Clear all history
 */
export const clearHistory = (): void => {
  historyManager.clear();
};

/**
 * Get history state (for debugging)
 */
export const getHistoryState = (): Readonly<HistoryState> => {
  return historyManager.getState();
};

/**
 * Set maximum history size
 */
export const setHistoryMaxSize = (size: number): void => {
  historyManager.setMaxSize(size);
};

