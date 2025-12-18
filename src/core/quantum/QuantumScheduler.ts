/**
 * QUANTUM SCHEDULER - Cooperative Task Prioritization
 * 
 * The invisible infrastructure that ensures audio never drops,
 * AI inference runs smoothly, and UI stays responsive.
 * 
 * Priority Tiers:
 * 1. Audio DSP (highest) - Must complete within 16ms budget
 * 2. AI Inference (medium) - Can defer, batch when possible
 * 3. UI Updates (lowest) - Can batch and defer
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 1 Foundation
 */

import { als } from '../../utils/alsFeedback';

export type TaskPriority = 'audio' | 'ai' | 'ui';

export interface QuantumTask {
  id: string;
  priority: TaskPriority;
  budgetMs: number; // Maximum time budget for this task
  execute: () => void | Promise<void>;
  onOverrun?: (actualMs: number, budgetMs: number) => void;
  metadata?: Record<string, unknown>;
}

export interface QuantumSchedulerStats {
  audioTasksCompleted: number;
  audioTasksOverrun: number;
  aiTasksCompleted: number;
  aiTasksDeferred: number;
  uiTasksCompleted: number;
  uiTasksBatched: number;
  audioStarvationWarnings: number;
  lastAudioTaskTime: number;
  lastAITaskTime: number;
  lastUITaskTime: number;
}

export interface QuantumSchedulerTrace {
  taskId: string;
  priority: TaskPriority;
  startTime: number;
  endTime: number;
  duration: number;
  budgetMs: number;
  overrun: boolean;
  deferred: boolean;
  batched: boolean;
}

// Session Probe integration
// Window interface extensions moved to src/types/globals.d.ts

class QuantumScheduler {
  private audioQueue: QuantumTask[] = [];
  private aiQueue: QuantumTask[] = [];
  private uiQueue: QuantumTask[] = [];
  
  private audioBudgetMs = 16; // 60fps audio (16.67ms per frame)
  private aiBudgetMs = 50; // AI can take longer
  private uiBudgetMs = 100; // UI can batch
  
  private stats: QuantumSchedulerStats = {
    audioTasksCompleted: 0,
    audioTasksOverrun: 0,
    aiTasksCompleted: 0,
    aiTasksDeferred: 0,
    uiTasksCompleted: 0,
    uiTasksBatched: 0,
    audioStarvationWarnings: 0,
    lastAudioTaskTime: 0,
    lastAITaskTime: 0,
    lastUITaskTime: 0,
  };
  
  private traces: QuantumSchedulerTrace[] = [];
  private maxTraces = 1000; // Keep last 1000 traces
  
  private isProcessing = false;
  private audioStarvationThreshold = 20; // Warn if audio queue > 20ms behind
  
  /**
   * Register a task with the scheduler
   */
  registerTask(task: QuantumTask): void {
    switch (task.priority) {
      case 'audio':
        this.audioQueue.push(task);
        break;
      case 'ai':
        this.aiQueue.push(task);
        break;
      case 'ui':
        this.uiQueue.push(task);
        break;
    }
    
    // Trigger processing if not already running
    if (!this.isProcessing) {
      this.processQueues();
    }
  }
  
  /**
   * Process all queues in priority order
   */
  private async processQueues(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const frameStart = performance.now();
    
    try {
      // Process audio tasks first (highest priority)
      await this.processAudioQueue(frameStart);
      
      // Process AI tasks (medium priority, can defer)
      await this.processAIQueue(frameStart);
      
      // Process UI tasks (lowest priority, can batch)
      await this.processUIQueue(frameStart);
      
      // Check for audio starvation
      this.checkAudioStarvation();
      
    } finally {
      this.isProcessing = false;
      
      // If queues still have tasks, schedule next frame
      if (this.hasPendingTasks()) {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => this.processQueues(), { timeout: 5 });
        } else {
          setTimeout(() => this.processQueues(), 5);
        }
      }
    }
  }
  
  /**
   * Process audio queue - highest priority, must complete within budget
   */
  private async processAudioQueue(frameStart: number): Promise<void> {
    const audioStart = performance.now();
    const remainingBudget = this.audioBudgetMs - (audioStart - frameStart);
    
    if (remainingBudget <= 0) {
      // No time left for audio this frame
      this.stats.audioStarvationWarnings++;
      return;
    }
    
    while (this.audioQueue.length > 0 && (performance.now() - audioStart) < remainingBudget) {
      const task = this.audioQueue.shift();
      if (!task) break;
      
      const taskStart = performance.now();
      let taskEnd = taskStart;
      let overrun = false;
      
      try {
        const result = task.execute();
        if (result instanceof Promise) {
          await result;
        }
        taskEnd = performance.now();
        
        const duration = taskEnd - taskStart;
        if (duration > task.budgetMs) {
          overrun = true;
          this.stats.audioTasksOverrun++;
          task.onOverrun?.(duration, task.budgetMs);
        }
        
        this.stats.audioTasksCompleted++;
        this.stats.lastAudioTaskTime = taskEnd;
        
      } catch (error) {
        als.error('[QuantumScheduler] Audio task error', error);
        taskEnd = performance.now();
      }
      
      // Record trace
      this.recordTrace({
        taskId: task.id,
        priority: 'audio',
        startTime: taskStart,
        endTime: taskEnd,
        duration: taskEnd - taskStart,
        budgetMs: task.budgetMs,
        overrun,
        deferred: false,
        batched: false,
      });
    }
  }
  
  /**
   * Process AI queue - medium priority, can defer if needed
   */
  private async processAIQueue(frameStart: number): Promise<void> {
    const aiStart = performance.now();
    const frameTime = aiStart - frameStart;
    const remainingBudget = this.aiBudgetMs - frameTime;
    
    if (remainingBudget <= 0) {
      // Defer AI tasks if no time left
      this.stats.aiTasksDeferred += this.aiQueue.length;
      return;
    }
    
    // Process up to 2 AI tasks per frame (can batch)
    let processed = 0;
    const maxAITasksPerFrame = 2;
    
    while (this.aiQueue.length > 0 && processed < maxAITasksPerFrame && (performance.now() - aiStart) < remainingBudget) {
      const task = this.aiQueue.shift();
      if (!task) break;
      
      const taskStart = performance.now();
      let taskEnd = taskStart;
      let overrun = false;
      
      try {
        const result = task.execute();
        if (result instanceof Promise) {
          await result;
        }
        taskEnd = performance.now();
        
        const duration = taskEnd - taskStart;
        if (duration > task.budgetMs) {
          overrun = true;
          task.onOverrun?.(duration, task.budgetMs);
        }
        
        this.stats.aiTasksCompleted++;
        this.stats.lastAITaskTime = taskEnd;
        processed++;
        
      } catch (error) {
        als.error('[QuantumScheduler] AI task error', error);
        taskEnd = performance.now();
      }
      
      // Record trace
      this.recordTrace({
        taskId: task.id,
        priority: 'ai',
        startTime: taskStart,
        endTime: taskEnd,
        duration: taskEnd - taskStart,
        budgetMs: task.budgetMs,
        overrun,
        deferred: false,
        batched: processed > 1,
      });
    }
  }
  
  /**
   * Process UI queue - lowest priority, can batch
   */
  private async processUIQueue(frameStart: number): Promise<void> {
    const uiStart = performance.now();
    const frameTime = uiStart - frameStart;
    const remainingBudget = this.uiBudgetMs - frameTime;
    
    if (remainingBudget <= 0) {
      // Defer UI tasks if no time left
      return;
    }
    
    // Batch UI tasks - process multiple in one frame
    const batchSize = Math.min(this.uiQueue.length, 10); // Max 10 UI tasks per frame
    const batched = batchSize > 1;
    
    for (let i = 0; i < batchSize && (performance.now() - uiStart) < remainingBudget; i++) {
      const task = this.uiQueue.shift();
      if (!task) break;
      
      const taskStart = performance.now();
      let taskEnd = taskStart;
      
      try {
        const result = task.execute();
        if (result instanceof Promise) {
          await result;
        }
        taskEnd = performance.now();
        
        this.stats.uiTasksCompleted++;
        this.stats.lastUITaskTime = taskEnd;
        if (batched) {
          this.stats.uiTasksBatched++;
        }
        
      } catch (error) {
        als.error('[QuantumScheduler] UI task error', error);
        taskEnd = performance.now();
      }
      
      // Record trace
      this.recordTrace({
        taskId: task.id,
        priority: 'ui',
        startTime: taskStart,
        endTime: taskEnd,
        duration: taskEnd - taskStart,
        budgetMs: task.budgetMs,
        overrun: false,
        deferred: false,
        batched,
      });
    }
  }
  
  /**
   * Check for audio starvation
   */
  private checkAudioStarvation(): void {
    if (this.audioQueue.length > 0) {
      const oldestTask = this.audioQueue[0];
      const queuedAt = (oldestTask.metadata as Record<string, any>)?.queuedAt;
      if (oldestTask && typeof queuedAt === 'number' && performance.now() - queuedAt > this.audioStarvationThreshold) {
        this.stats.audioStarvationWarnings++;
        als.warning(`[QuantumScheduler] Audio starvation detected - queue backlog: ${this.audioQueue.length}`);
      }
    }
  }
  
  /**
   * Record trace for Session Probe
   */
  private recordTrace(trace: QuantumSchedulerTrace): void {
    this.traces.push(trace);
    
    // Keep only last N traces
    if (this.traces.length > this.maxTraces) {
      this.traces.shift();
    }
    
    // Expose to window for Session Probe
    if (typeof window !== 'undefined') {
      if (!window.__quantum_scheduler_traces) {
        window.__quantum_scheduler_traces = [];
      }
      window.__quantum_scheduler_traces.push(trace);
      
      // Keep window traces limited too
      if (window.__quantum_scheduler_traces.length > this.maxTraces) {
        window.__quantum_scheduler_traces.shift();
      }
    }
  }
  
  /**
   * Check if there are pending tasks
   */
  private hasPendingTasks(): boolean {
    return this.audioQueue.length > 0 || this.aiQueue.length > 0 || this.uiQueue.length > 0;
  }
  
  /**
   * Get current statistics
   */
  getStats(): QuantumSchedulerStats {
    return { ...this.stats };
  }
  
  /**
   * Get recent traces
   */
  getTraces(limit: number = 100): QuantumSchedulerTrace[] {
    return this.traces.slice(-limit);
  }
  
  /**
   * Clear all queues (emergency stop)
   */
  clearQueues(): void {
    this.audioQueue = [];
    this.aiQueue = [];
    this.uiQueue = [];
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      audioTasksCompleted: 0,
      audioTasksOverrun: 0,
      aiTasksCompleted: 0,
      aiTasksDeferred: 0,
      uiTasksCompleted: 0,
      uiTasksBatched: 0,
      audioStarvationWarnings: 0,
      lastAudioTaskTime: 0,
      lastAITaskTime: 0,
      lastUITaskTime: 0,
    };
  }
}

// Global singleton instance
let globalScheduler: QuantumScheduler | null = null;

/**
 * Get the global Quantum Scheduler instance
 */
export function getQuantumScheduler(): QuantumScheduler {
  if (!globalScheduler) {
    globalScheduler = new QuantumScheduler();
  }
  return globalScheduler;
}

/**
 * Register a task with the quantum scheduler
 */
export function registerQuantumTask(task: QuantumTask): void {
  // Add queued timestamp to metadata
  const taskWithMetadata: QuantumTask = {
    ...task,
    metadata: {
      ...task.metadata,
      queuedAt: performance.now(),
    },
  };
  
  getQuantumScheduler().registerTask(taskWithMetadata);
}

/**
 * Convenience function for audio tasks
 */
export function scheduleAudioTask(
  id: string,
  execute: () => void | Promise<void>,
  budgetMs: number = 16,
  onOverrun?: (actualMs: number, budgetMs: number) => void
): void {
  registerQuantumTask({
    id,
    priority: 'audio',
    budgetMs,
    execute,
    onOverrun,
  });
}

/**
 * Convenience function for AI tasks
 */
export function scheduleAITask(
  id: string,
  execute: () => void | Promise<void>,
  budgetMs: number = 50,
  onOverrun?: (actualMs: number, budgetMs: number) => void
): void {
  registerQuantumTask({
    id,
    priority: 'ai',
    budgetMs,
    execute,
    onOverrun,
  });
}

/**
 * Convenience function for UI tasks
 */
export function scheduleUITask(
  id: string,
  execute: () => void | Promise<void>,
  budgetMs: number = 100,
  onOverrun?: (actualMs: number, budgetMs: number) => void
): void {
  registerQuantumTask({
    id,
    priority: 'ui',
    budgetMs,
    execute,
    onOverrun,
  });
}

