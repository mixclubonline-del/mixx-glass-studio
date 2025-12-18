/**
 * VelvetMeteringNode
 * Phase 34: AudioWorklet Migration
 * 
 * TypeScript wrapper for the velvet-metering-processor AudioWorklet.
 * Provides event-based API for receiving meter readings from the worklet.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MeterData {
  rms: number;
  level: number;
  peak: number;
  crestFactor: number;
  transient: boolean;
  lowBandEnergy: number;
  spectralTilt: number;
}

export type MeterCallback = (data: MeterData) => void;

// ═══════════════════════════════════════════════════════════════════════════
// Worklet Registration State
// ═══════════════════════════════════════════════════════════════════════════

let workletRegistered = false;
let workletRegistering: Promise<void> | null = null;

/**
 * Register the metering worklet module with an AudioContext
 */
async function ensureWorkletRegistered(context: AudioContext): Promise<boolean> {
  if (workletRegistered) {
    return true;
  }
  
  if (workletRegistering) {
    await workletRegistering;
    return workletRegistered;
  }
  
  if (!('audioWorklet' in context)) {
    console.warn('[VelvetMeteringNode] AudioWorklet not supported');
    return false;
  }
  
  try {
    workletRegistering = context.audioWorklet.addModule(
      new URL('../worklets/velvet-metering-processor.js', import.meta.url)
    );
    await workletRegistering;
    workletRegistered = true;
    console.log('[VelvetMeteringNode] Worklet registered successfully');
    return true;
  } catch (error) {
    console.warn('[VelvetMeteringNode] Failed to register worklet:', error);
    workletRegistered = false;
    return false;
  } finally {
    workletRegistering = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VelvetMeteringNode Class
// ═══════════════════════════════════════════════════════════════════════════

/**
 * VelvetMeteringNode - AudioWorklet-based metering
 * 
 * Usage:
 * ```ts
 * const meter = await VelvetMeteringNode.create(audioContext);
 * if (meter) {
 *   sourceNode.connect(meter.node);
 *   meter.node.connect(audioContext.destination);
 *   meter.onMeter((data) => {
 *     console.log('Peak:', data.peak, 'RMS:', data.rms);
 *   });
 * }
 * ```
 */
export class VelvetMeteringNode {
  public readonly node: AudioWorkletNode;
  private callbacks: Set<MeterCallback> = new Set();
  private lastData: MeterData | null = null;

  private constructor(node: AudioWorkletNode) {
    this.node = node;
    
    // Listen for messages from the worklet
    this.node.port.onmessage = (event) => {
      if (event.data?.type === 'meter') {
        const data: MeterData = {
          rms: event.data.rms ?? 0,
          level: event.data.level ?? 0,
          peak: event.data.peak ?? 0,
          crestFactor: event.data.crestFactor ?? 1,
          transient: event.data.transient ?? false,
          lowBandEnergy: event.data.lowBandEnergy ?? 0,
          spectralTilt: event.data.spectralTilt ?? 0,
        };
        
        this.lastData = data;
        this.callbacks.forEach(cb => cb(data));
      }
    };
  }

  /**
   * Create a VelvetMeteringNode
   * Returns null if worklet registration fails
   */
  static async create(context: AudioContext): Promise<VelvetMeteringNode | null> {
    const registered = await ensureWorkletRegistered(context);
    
    if (!registered) {
      return null;
    }
    
    try {
      const node = new AudioWorkletNode(context, 'velvet-metering-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      
      return new VelvetMeteringNode(node);
    } catch (error) {
      console.error('[VelvetMeteringNode] Failed to create node:', error);
      return null;
    }
  }

  /**
   * Register a callback for meter data
   */
  onMeter(callback: MeterCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with last data if available
    if (this.lastData) {
      callback(this.lastData);
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get the last received meter data
   */
  getLastData(): MeterData | null {
    return this.lastData;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.callbacks.clear();
    try {
      this.node.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if AudioWorklet metering is available
 */
export function isWorkletMeteringAvailable(): boolean {
  return typeof AudioWorkletNode !== 'undefined';
}

/**
 * Create a connected metering node between source and destination
 */
export async function createMeteringPath(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode
): Promise<{ meter: VelvetMeteringNode | null; cleanup: () => void }> {
  const meter = await VelvetMeteringNode.create(context);
  
  if (meter) {
    source.connect(meter.node);
    meter.node.connect(destination);
    
    return {
      meter,
      cleanup: () => {
        try {
          source.disconnect(meter.node);
          meter.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      },
    };
  }
  
  // Fallback: connect directly
  source.connect(destination);
  
  return {
    meter: null,
    cleanup: () => {
      try {
        source.disconnect(destination);
      } catch {
        // Ignore
      }
    },
  };
}
