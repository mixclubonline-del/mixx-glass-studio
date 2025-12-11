/**
 * Auto-Pull Service
 * what: Automatic git repository synchronization
 * why: Keep Flow by ensuring code stays in sync without manual intervention
 * how: Periodic git pull operations via Tauri commands
 */

interface AutoPullState {
  isEnabled: boolean;
  lastPullTime: number | null;
  pullInProgress: boolean;
  lastError: string | null;
  interval: number; // in milliseconds
}

interface GitStatus {
  hasChanges: boolean;
  hasConflicts: boolean;
  branch: string;
  ahead: number;
  behind: number;
}

class AutoPullService {
  private state: AutoPullState = {
    isEnabled: false, // Disabled by default for safety
    lastPullTime: null,
    pullInProgress: false,
    lastError: null,
    interval: 300000, // 5 minutes default
  };
  private pullTimer: number | null = null;
  private onStatusChange: ((status: AutoPullState) => void) | null = null;
  private invokeCommand: ((cmd: string, args?: any) => Promise<any>) | null = null;
  private consumerCount: number = 0; // Track number of active consumers

  /**
   * Initialize the auto-pull service
   */
  async initialize(invokeCommandFn: (cmd: string, args?: any) => Promise<any>): Promise<void> {
    this.invokeCommand = invokeCommandFn;
    this.loadSettings();
    
    // Start interval if auto-pull was previously enabled
    if (this.state.isEnabled) {
      this.startInterval();
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('mixx-autopull-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.isEnabled = settings.isEnabled === true;
        this.state.interval = settings.interval || 300000;
      }
    } catch (error) {
      console.warn('[AutoPull] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(
        'mixx-autopull-settings',
        JSON.stringify({
          isEnabled: this.state.isEnabled,
          interval: this.state.interval,
        })
      );
    } catch (error) {
      console.warn('[AutoPull] Failed to save settings:', error);
    }
  }

  /**
   * Register callback for status changes
   */
  onStatusChangeCallback(callback: (status: AutoPullState) => void): void {
    this.onStatusChange = callback;
    callback(this.state);
  }

  /**
   * Enable or disable auto-pull
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
   * Set pull interval
   */
  setInterval(intervalMs: number): void {
    this.state.interval = intervalMs;
    this.saveSettings();
    this.notifyStatusChange();

    if (this.state.isEnabled) {
      this.stopInterval();
      this.startInterval();
    }
  }

  /**
   * Check if auto-pull is enabled
   */
  isEnabled(): boolean {
    return this.state.isEnabled;
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
   * Get current git status
   */
  async getGitStatus(): Promise<GitStatus | null> {
    if (!this.invokeCommand) {
      return null;
    }

    try {
      const status = await this.invokeCommand('git_status');
      return status as GitStatus;
    } catch (error) {
      console.error('[AutoPull] Failed to get git status:', error);
      return null;
    }
  }

  /**
   * Perform a git pull operation
   */
  async pullNow(): Promise<{ success: boolean; message: string }> {
    if (!this.invokeCommand) {
      return { success: false, message: 'Tauri commands not available' };
    }

    if (this.state.pullInProgress) {
      return { success: false, message: 'Pull already in progress' };
    }

    this.state.pullInProgress = true;
    this.state.lastError = null;
    this.notifyStatusChange();

    try {
      // Check for uncommitted changes first
      const status = await this.getGitStatus();
      if (status?.hasChanges) {
        this.state.pullInProgress = false;
        this.state.lastError = 'Uncommitted changes detected. Please commit or stash before pulling.';
        this.notifyStatusChange();
        return { success: false, message: this.state.lastError };
      }

      // Perform pull
      const result = await this.invokeCommand('git_pull');
      this.state.lastPullTime = Date.now();
      this.state.pullInProgress = false;
      this.notifyStatusChange();

      return { success: true, message: result || 'Pull completed successfully' };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      this.state.lastError = errorMessage;
      this.state.pullInProgress = false;
      this.notifyStatusChange();

      console.error('[AutoPull] Failed to pull:', error);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Start periodic auto-pull interval
   */
  private startInterval(): void {
    if (this.pullTimer !== null) {
      return;
    }

    // Set up periodic pull interval
    this.pullTimer = window.setInterval(() => {
      if (this.state.isEnabled && !this.state.pullInProgress) {
        this.pullNow().catch((error) => {
          console.error('[AutoPull] Interval pull failed:', error);
        });
      }
    }, this.state.interval);
  }

  /**
   * Stop periodic auto-pull interval
   */
  private stopInterval(): void {
    if (this.pullTimer !== null) {
      clearInterval(this.pullTimer);
      this.pullTimer = null;
    }
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChange(): void {
    if (this.onStatusChange) {
      this.onStatusChange({ ...this.state });
    }
  }

  /**
   * Get current pull status
   */
  getStatus(): AutoPullState {
    return { ...this.state };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopInterval();
  }
}

// Singleton instance
export const autoPullService = new AutoPullService();

