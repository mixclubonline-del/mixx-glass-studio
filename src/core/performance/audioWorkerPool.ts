/**
 * QUANTUM AUDIO WORKER POOL - Managed Worker Instance Pool
 * 
 * Manages a pool of audio workers for parallel processing.
 * Reuses workers to avoid creation overhead.
 * 
 * Flow Doctrine: Efficient resource management
 * Reductionist Engineering: Pool pattern for workers
 * 
 * @author Prime (Mixx Club)
 */

import type { AudioWorkerMessage, AudioWorkerResponse } from './audioWorker';

interface PendingTask {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout: number;
}

class AudioWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private pendingTasks = new Map<string, PendingTask>();
  private maxWorkers: number;
  private workerUrl: string | URL;

  constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
    // Create worker from inline blob or URL
    const workerCode = `
      ${self.fetch ? '' : '// Worker code will be loaded from audioWorker.ts'}
    `;
    this.workerUrl = new URL('../performance/audioWorker.ts', import.meta.url);
  }

  /**
   * Execute a task on an available worker
   */
  async execute(message: AudioWorkerMessage, timeout: number = 5000): Promise<any> {
    const worker = await this.getAvailableWorker();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingTasks.delete(message.id);
        reject(new Error(`Worker task timeout: ${message.id}`));
      }, timeout);

      this.pendingTasks.set(message.id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timeout: timeoutId as any,
      });

      worker.postMessage(message);
    });
  }

  private async getAvailableWorker(): Promise<Worker> {
    // Return available worker if any
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!;
    }

    // Create new worker if under limit
    if (this.workers.length < this.maxWorkers) {
      return this.createWorker();
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkAvailable = () => {
        if (this.availableWorkers.length > 0) {
          resolve(this.availableWorkers.pop()!);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  private createWorker(): Worker {
    try {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      
      worker.onmessage = (event: MessageEvent<AudioWorkerResponse>) => {
        const { id, result, error } = event.data;
        const task = this.pendingTasks.get(id);
        
        if (task) {
          this.pendingTasks.delete(id);
          if (error) {
            task.reject(new Error(error));
          } else {
            task.resolve(result);
          }
        }

        // Return worker to pool
        this.availableWorkers.push(worker);
      };

      worker.onerror = (error) => {
        console.error('[WORKER POOL] Worker error:', error);
        // Remove failed worker
        const index = this.workers.indexOf(worker);
        if (index > -1) {
          this.workers.splice(index, 1);
        }
      };

      this.workers.push(worker);
      return worker;
    } catch (err) {
      console.error('[WORKER POOL] Failed to create worker:', err);
      throw err;
    }
  }

  /**
   * Terminate all workers
   */
  terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks.clear();
  }
}

// Singleton instance
export const audioWorkerPool = new AudioWorkerPool();

