/**
 * QUANTUM IDLE SCHEDULER - Non-Critical Work During Idle Time
 * 
 * Schedules non-critical work to run during browser idle time.
 * Prevents blocking the main thread for non-urgent tasks.
 * 
 * Flow Doctrine: Don't block the flow
 * Reductionist Engineering: Defer non-critical work
 * 
 * @author Prime (Mixx Club)
 */

interface IdleTask {
  id: string;
  callback: () => void;
  priority: 'low' | 'medium' | 'high';
  timeout: number;
}

class IdleScheduler {
  private tasks: IdleTask[] = [];
  private isScheduled = false;

  /**
   * Schedule a task to run during idle time
   */
  schedule(
    id: string,
    callback: () => void,
    options: { priority?: 'low' | 'medium' | 'high'; timeout?: number } = {}
  ): () => void {
    const task: IdleTask = {
      id,
      callback,
      priority: options.priority || 'low',
      timeout: options.timeout || 5000,
    };

    // Remove existing task with same ID
    this.tasks = this.tasks.filter((t) => t.id !== id);
    
    // Insert based on priority
    if (task.priority === 'high') {
      this.tasks.unshift(task);
    } else if (task.priority === 'medium') {
      const highCount = this.tasks.filter((t) => t.priority === 'high').length;
      this.tasks.splice(highCount, 0, task);
    } else {
      this.tasks.push(task);
    }

    this.scheduleNext();

    return () => {
      this.tasks = this.tasks.filter((t) => t.id !== id);
    };
  }

  private scheduleNext(): void {
    if (this.isScheduled || this.tasks.length === 0) return;

    this.isScheduled = true;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        (deadline: IdleDeadline) => {
          this.isScheduled = false;
          this.processTasks(deadline);
        },
        { timeout: 5000 }
      );
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        this.isScheduled = false;
        this.processTasks({
          timeRemaining: () => 16, // Assume 16ms available
          didTimeout: false,
        } as IdleDeadline);
      }, 0);
    }
  }

  private processTasks(deadline: IdleDeadline): void {
    while (this.tasks.length > 0 && deadline.timeRemaining() > 0) {
      const task = this.tasks.shift();
      if (!task) break;

      try {
        task.callback();
      } catch (err) {
        console.warn(`[IDLE SCHEDULER] Task ${task.id} failed:`, err);
      }
    }

    // Schedule next batch if tasks remain
    if (this.tasks.length > 0) {
      this.scheduleNext();
    }
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks = [];
    this.isScheduled = false;
  }
}

// Singleton instance
export const idleScheduler = new IdleScheduler();

