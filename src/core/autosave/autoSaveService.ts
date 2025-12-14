/**
 * Auto-Save Service
 * what: Automatic project state persistence with IndexedDB
 * why: Preserve Flow by eliminating manual save friction, reinforce Mixx Recall
 * how: Periodic saves to IndexedDB with debouncing and recovery support
 */

import type { PersistedProjectState } from '../../App';
import { als } from '../../utils/alsFeedback';

const DB_NAME = 'mixx-studio-autosave';
const DB_VERSION = 1;
const STORE_NAME = 'project-states';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 2000; // 2 seconds after last change

interface AutoSaveState {
  isEnabled: boolean;
  lastSaveTime: number | null;
  pendingChanges: boolean;
  saveInProgress: boolean;
}

class AutoSaveService {
  private db: IDBDatabase | null = null;
  private state: AutoSaveState = {
    isEnabled: true,
    lastSaveTime: null,
    pendingChanges: false,
    saveInProgress: false,
  };
  private saveTimer: number | null = null;
  private debounceTimer: number | null = null;
  private intervalTimer: number | null = null;
  private getProjectState: (() => PersistedProjectState) | null = null;
  private onSaveStatusChange: ((status: AutoSaveState) => void) | null = null;
  private consumerCount: number = 0; // Track number of active consumers

  /**
   * Initialize the auto-save service
   * Safe to call multiple times - will only initialize once
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.db !== null) {
      return;
    }

    try {
      this.db = await this.openDatabase();
      this.loadSettings();
      this.startInterval();
    } catch (error) {
      als.error('[AutoSave] Failed to initialize', error);
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
          store.createIndex('timestamp', 'timestamp', { unique: true });
        }
      };
    });
  }

  /**
   * Load auto-save settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('mixx-autosave-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.isEnabled = settings.isEnabled !== false;
      }
    } catch (error) {
      // Settings load failure is non-critical - continue with defaults
      if (import.meta.env.DEV) {
        als.warning('[AutoSave] Failed to load settings, using defaults');
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(
        'mixx-autosave-settings',
        JSON.stringify({ isEnabled: this.state.isEnabled })
      );
    } catch (error) {
      // Settings save failure is non-critical
      if (import.meta.env.DEV) {
        als.warning('[AutoSave] Failed to save settings');
      }
    }
  }

  /**
   * Register the function to get current project state
   * Can be called multiple times to update the getter
   */
  registerStateGetter(getter: () => PersistedProjectState): void {
    this.getProjectState = getter;
  }

  /**
   * Increment consumer count (called when a component mounts)
   */
  addConsumer(): void {
    this.consumerCount++;
  }

  /**
   * Decrement consumer count (called when a component unmounts)
   * Only shutdowns when the last consumer is removed
   */
  removeConsumer(): void {
    this.consumerCount = Math.max(0, this.consumerCount - 1);
    if (this.consumerCount === 0) {
      this.shutdown();
    }
  }

  /**
   * Check if service has any active consumers
   */
  hasConsumers(): boolean {
    return this.consumerCount > 0;
  }

  /**
   * Register callback for save status changes
   */
  onStatusChange(callback: (status: AutoSaveState) => void): void {
    this.onSaveStatusChange = callback;
    callback(this.state);
  }

  /**
   * Enable or disable auto-save
   */
  setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled;
    this.saveSettings();
    this.notifyStatusChange();

    if (enabled) {
      this.startInterval();
    } else {
      this.stopInterval();
    }
  }

  /**
   * Check if auto-save is enabled
   */
  isEnabled(): boolean {
    return this.state.isEnabled;
  }

  /**
   * Trigger an immediate save (with debouncing)
   */
  saveNow(): void {
    if (!this.state.isEnabled || !this.getProjectState) {
      return;
    }

    this.state.pendingChanges = true;
    this.notifyStatusChange();

    // Clear existing debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce: wait for quiet period before saving
    this.debounceTimer = window.setTimeout(() => {
      this.performSave();
    }, DEBOUNCE_DELAY);
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(): Promise<void> {
    if (!this.db || !this.getProjectState || this.state.saveInProgress) {
      return;
    }

    this.state.saveInProgress = true;
    this.notifyStatusChange();

    try {
      const projectState = this.getProjectState();
      const timestamp = Date.now();
      const saveData = {
        timestamp,
        state: projectState,
        version: '1.0',
      };

      await this.saveToDatabase(saveData);

      this.state.lastSaveTime = timestamp;
      this.state.pendingChanges = false;
      this.state.saveInProgress = false;
      this.notifyStatusChange();
    } catch (error) {
      als.error('[AutoSave] Failed to save project state', error);
      this.state.saveInProgress = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Save data to IndexedDB
   */
  private saveToDatabase(data: { timestamp: number; state: PersistedProjectState; version: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Keep only last 10 auto-saves
      const request = store.getAll();
      request.onsuccess = () => {
        const allSaves = request.result;
        if (allSaves.length >= 10) {
          // Delete oldest saves
          const sorted = allSaves.sort((a, b) => a.timestamp - b.timestamp);
          const toDelete = sorted.slice(0, sorted.length - 9);
          toDelete.forEach((item) => {
            store.delete(item.timestamp);
          });
        }

        // Add new save
        const addRequest = store.add(data);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load the most recent auto-save
   */
  async loadLatest(): Promise<PersistedProjectState | null> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Get latest

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value.state);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get list of all auto-saves
   */
  async getAllSaves(): Promise<Array<{ timestamp: number; state: PersistedProjectState }>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const saves = request.result.map((item) => ({
          timestamp: item.timestamp,
          state: item.state,
        }));
        resolve(saves.sort((a, b) => b.timestamp - a.timestamp));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Start periodic auto-save interval
   */
  private startInterval(): void {
    if (this.intervalTimer !== null) {
      return;
    }

    this.intervalTimer = window.setInterval(() => {
      if (this.state.isEnabled && this.state.pendingChanges && !this.state.saveInProgress) {
        this.performSave();
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop periodic auto-save interval
   */
  private stopInterval(): void {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChange(): void {
    if (this.onSaveStatusChange) {
      this.onSaveStatusChange({ ...this.state });
    }
  }

  /**
   * Get current save status
   */
  getStatus(): AutoSaveState {
    return { ...this.state };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopInterval();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const autoSaveService = new AutoSaveService();

