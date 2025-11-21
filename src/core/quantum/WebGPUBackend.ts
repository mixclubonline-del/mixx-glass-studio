/**
 * WEBGPU BACKEND MANAGER
 * 
 * Manages TensorFlow.js WebGPU backend initialization and fallback.
 * Provides graceful degradation to CPU if WebGPU is unavailable.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 2 WebGPU Integration
 */

import * as tf from '@tensorflow/tfjs';

export type BackendType = 'webgpu' | 'cpu' | 'webgl';

export interface BackendStatus {
  type: BackendType;
  available: boolean;
  initialized: boolean;
  error?: string;
  performanceHint?: string;
}

class WebGPUBackendManager {
  private status: BackendStatus = {
    type: 'cpu',
    available: false,
    initialized: false,
  };
  
  private initializationPromise: Promise<void> | null = null;
  
  /**
   * Check if WebGPU is available in the browser
   */
  async checkWebGPUSupport(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return false;
    }
    
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }
  
  /**
   * Initialize WebGPU backend with fallback
   */
  async initialize(): Promise<BackendStatus> {
    // If already initialized, return current status
    if (this.status.initialized) {
      return this.status;
    }
    
    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      return this.status;
    }
    
    // Start initialization
    this.initializationPromise = this._initialize();
    await this.initializationPromise;
    
    return this.status;
  }
  
  private async _initialize(): Promise<void> {
    try {
      // Check WebGPU support first
      const webgpuSupported = await this.checkWebGPUSupport();
      
      if (webgpuSupported) {
        try {
          // Try to set WebGPU backend
          await tf.setBackend('webgpu');
          await tf.ready();
          
          const backend = tf.getBackend();
          
          if (backend === 'webgpu') {
            this.status = {
              type: 'webgpu',
              available: true,
              initialized: true,
              performanceHint: 'WebGPU acceleration active - 10-100x speedup expected',
            };
            
            console.log('🔮 WebGPU Backend: ACTIVE - Quantum speed unlocked');
            return;
          }
        } catch (webgpuError) {
          console.warn('[WebGPU Backend] WebGPU initialization failed, falling back to CPU:', webgpuError);
          // Fall through to CPU fallback
        }
      }
      
      // Fallback to CPU
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        
        this.status = {
          type: 'cpu',
          available: true,
          initialized: true,
          error: webgpuSupported 
            ? 'WebGPU backend failed to initialize, using CPU fallback'
            : 'WebGPU not supported in this browser, using CPU fallback',
          performanceHint: 'CPU backend active - consider using Chrome/Edge for WebGPU acceleration',
        };
        
        console.log('🔮 WebGPU Backend: CPU fallback active');
      } catch (cpuError) {
        this.status = {
          type: 'cpu',
          available: false,
          initialized: false,
          error: `CPU backend initialization failed: ${cpuError}`,
        };
        
        console.error('[WebGPU Backend] CPU fallback also failed:', cpuError);
        throw cpuError;
      }
    } catch (error) {
      this.status = {
        type: 'cpu',
        available: false,
        initialized: false,
        error: error instanceof Error ? error.message : String(error),
      };
      
      throw error;
    } finally {
      this.initializationPromise = null;
    }
  }
  
  /**
   * Get current backend status
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }
  
  /**
   * Get current backend type
   */
  getBackendType(): BackendType {
    return this.status.type;
  }
  
  /**
   * Check if WebGPU is active
   */
  isWebGPUActive(): boolean {
    return this.status.type === 'webgpu' && this.status.initialized;
  }
  
  /**
   * Get performance metrics (if available)
   */
  async getPerformanceMetrics(): Promise<{
    backend: string;
    memoryInfo?: {
      numBytes: number;
      numTensors: number;
      numDataBuffers: number;
    };
  }> {
    const backend = tf.getBackend();
    const memoryInfo = tf.memory();
    
    return {
      backend,
      memoryInfo: {
        numBytes: memoryInfo.numBytes,
        numTensors: memoryInfo.numTensors,
        numDataBuffers: memoryInfo.numDataBuffers,
      },
    };
  }
  
  /**
   * Dispose and reset
   */
  dispose(): void {
    this.status = {
      type: 'cpu',
      available: false,
      initialized: false,
    };
    this.initializationPromise = null;
  }
}

// Global singleton instance
let globalBackendManager: WebGPUBackendManager | null = null;

/**
 * Get the global WebGPU Backend Manager instance
 */
export function getWebGPUBackendManager(): WebGPUBackendManager {
  if (!globalBackendManager) {
    globalBackendManager = new WebGPUBackendManager();
  }
  return globalBackendManager;
}

/**
 * Initialize WebGPU backend (call this early in app lifecycle)
 */
export async function initializeWebGPUBackend(): Promise<BackendStatus> {
  const manager = getWebGPUBackendManager();
  return await manager.initialize();
}

/**
 * Get current backend status
 */
export function getBackendStatus(): BackendStatus {
  return getWebGPUBackendManager().getStatus();
}

/**
 * Check if WebGPU is active
 */
export function isWebGPUActive(): boolean {
  return getWebGPUBackendManager().isWebGPUActive();
}

