/**
 * WASM WORKLET BRIDGE
 * 
 * Bridges WASM DSP module to AudioWorklet.
 * Compiles WASM on main thread, transfers Module to worklet.
 * 
 * Phase 39: Load WASM in AudioWorklet
 * 
 * @author Prime (Mixx Club)
 */

// WASM module URL
const WASM_URL = new URL('./pkg/mixx_dsp_wasm_bg.wasm', import.meta.url);

let compiledModule: WebAssembly.Module | null = null;
let compilePromise: Promise<WebAssembly.Module> | null = null;

/**
 * Compile WASM module on main thread (do this early)
 */
export async function compileWASMModule(): Promise<WebAssembly.Module> {
  if (compiledModule) return compiledModule;
  
  if (compilePromise) return compilePromise;
  
  compilePromise = (async () => {
    try {
      console.log('[WASM Bridge] ⏳ Compiling WASM module...');
      
      // Use compileStreaming for efficiency
      if (typeof WebAssembly.compileStreaming === 'function') {
        compiledModule = await WebAssembly.compileStreaming(fetch(WASM_URL));
      } else {
        // Fallback for older browsers
        const response = await fetch(WASM_URL);
        const buffer = await response.arrayBuffer();
        compiledModule = await WebAssembly.compile(buffer);
      }
      
      console.log('[WASM Bridge] ✅ WASM module compiled');
      return compiledModule;
    } catch (error) {
      console.error('[WASM Bridge] ❌ Failed to compile WASM:', error);
      throw error;
    }
  })();
  
  return compilePromise;
}

/**
 * Check if WASM module is compiled
 */
export function isWASMCompiled(): boolean {
  return compiledModule !== null;
}

export interface WASMWorkletNode {
  node: AudioWorkletNode;
  setFrequency: (frequency: number) => void;
  setQ: (q: number) => void;
  setWarmth: (warmth: number) => void;
  setBypass: (bypassed: boolean) => void;
  dispose: () => void;
}

/**
 * Create WASM DSP AudioWorkletNode
 * 
 * @param ctx - AudioContext
 * @param options - Initial settings
 */
export async function createWASMWorkletNode(
  ctx: AudioContext,
  options: {
    frequency?: number;
    q?: number;
    warmth?: number;
  } = {}
): Promise<WASMWorkletNode | null> {
  try {
    // Compile WASM if not already
    const wasmModule = await compileWASMModule();
    
    // Register worklet processor
    await ctx.audioWorklet.addModule(
      new URL('../../worklets/wasm-dsp-processor.js', import.meta.url)
    );
    
    // Create node with WASM module in processorOptions
    const node = new AudioWorkletNode(ctx, 'wasm-dsp-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        wasmModule,
        initialSettings: {
          frequency: options.frequency ?? 150,
          q: options.q ?? 0.7,
          warmth: options.warmth ?? 0.5,
        },
      },
    });
    
    // Wait for WASM initialization
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WASM init timeout')), 5000);
      
      node.port.onmessage = (event) => {
        if (event.data.type === 'wasmReady') {
          clearTimeout(timeout);
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error));
          }
        }
      };
    });
    
    console.log('[WASM Bridge] ✅ WASM worklet node created');
    
    return {
      node,
      setFrequency: (frequency: number) => {
        node.port.postMessage({ type: 'setFrequency', data: frequency });
      },
      setQ: (q: number) => {
        node.port.postMessage({ type: 'setQ', data: q });
      },
      setWarmth: (warmth: number) => {
        node.port.postMessage({ type: 'setWarmth', data: warmth });
      },
      setBypass: (bypassed: boolean) => {
        node.port.postMessage({ type: 'setBypass', data: bypassed });
      },
      dispose: () => {
        node.disconnect();
      },
    };
  } catch (error) {
    console.error('[WASM Bridge] ❌ Failed to create WASM worklet:', error);
    return null;
  }
}

/**
 * Pre-compile WASM on app startup for faster worklet creation
 */
export async function precompileWASM(): Promise<boolean> {
  try {
    await compileWASMModule();
    return true;
  } catch {
    return false;
  }
}
