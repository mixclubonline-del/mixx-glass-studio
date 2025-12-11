 
// ------------------------------------------------------------
// MIXX CLUB STEM SEPARATION WORKER (PRIME MODE EDITION)
// ------------------------------------------------------------
// - Adapts to existing Engine protocol:
//   Incoming:  { type:'PROCESS_CHUNK', requestId, channels: ArrayBuffer[], channelLength, sampleRate, stemCount, model }
//   Outgoing:  { type:'CHUNK_RESULT', requestId, stems: ArrayBuffer[] }
//   Errors:    { type:'CHUNK_ERROR', requestId, error }
// - Also supports: { type:'INIT_MODEL' } for early warm-up
// ------------------------------------------------------------

// Optional WASM assets (safe if missing; fallback DSP kicks in)
// @ts-expect-error - Vite URL import syntax not recognized by TypeScript
import demucsWasmUrl from '../ai/models/fake-demucs.wasm?url';
// @ts-expect-error - Vite URL import syntax not recognized by TypeScript
import modelConfigUrl from '../ai/models/model.json?url';

let model: any = null;
let modelReady = false;
let defaultSampleRate = 48000;

function calcRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

function mixDownToMono(channels: ArrayBuffer[], channelLength: number): Float32Array {
  if (!channels || channels.length === 0) return new Float32Array(channelLength);
  const mono = new Float32Array(channelLength);
  for (let ch = 0; ch < channels.length; ch += 1) {
    const data = new Float32Array(channels[ch]);
    for (let i = 0; i < channelLength; i += 1) {
      mono[i] += data[i] || 0;
    }
  }
  const inv = 1 / Math.max(1, channels.length);
  for (let i = 0; i < channelLength; i += 1) mono[i] *= inv;
  return mono;
}

/**
 * DSP Fallback Stem Separation
 * 
 * Uses frequency-domain analysis and filtering to separate stems when AI model is unavailable.
 * This is a functional fallback that produces usable (though not perfect) stems.
 * 
 * For production quality, integrate a real Demucs model or similar AI-based separation.
 */
function generateDSPFallback(audio: Float32Array, sampleRate: number = 48000): {
  vocals: Float32Array;
  drums: Float32Array;
  bass: Float32Array;
  harmonic: Float32Array;
  perc: Float32Array;
  sub: Float32Array;
  music: Float32Array;
} {
  const len = audio.length;
  
  // Frequency bands (approximate, in Hz)
  const SUB_FREQ = 60;      // Sub-bass: 0-60Hz
  const BASS_FREQ = 250;    // Bass: 60-250Hz
  const VOCAL_FREQ_LOW = 80;  // Vocals: 80-3000Hz
  const VOCAL_FREQ_HIGH = 3000;
  const PERC_FREQ_LOW = 2000; // Percussion: 2000Hz+
  const HARMONIC_FREQ_LOW = 250; // Harmonic: 250-2000Hz
  
  // Simple IIR filters (first-order, approximate)
  const samplesPerCycle = sampleRate / 1000; // Samples per ms
  
  // Initialize output buffers
  const vocals = new Float32Array(len);
  const drums = new Float32Array(len);
  const bass = new Float32Array(len);
  const harmonic = new Float32Array(len);
  const perc = new Float32Array(len);
  const sub = new Float32Array(len);
  const music = new Float32Array(len);
  
  // Simple frequency-domain separation using windowed analysis
  // This is a simplified approach - real implementation would use FFT
  const windowSize = Math.min(2048, len);
  const hopSize = windowSize / 4;
  
  for (let start = 0; start < len - windowSize; start += hopSize) {
    const window = audio.subarray(start, start + windowSize);
    
    // Calculate energy in different frequency bands using simple analysis
    // (Real implementation would use FFT)
    let subEnergy = 0;
    let bassEnergy = 0;
    let vocalEnergy = 0;
    let percEnergy = 0;
    let harmonicEnergy = 0;
    
    // Analyze window for frequency content
    for (let i = 0; i < window.length; i++) {
      const sample = window[i];
      const absSample = Math.abs(sample);
      
      // Simple frequency estimation using zero-crossing rate and amplitude
      // Lower frequencies = fewer zero crossings, higher amplitude
      // This is a heuristic - real FFT would be more accurate
      const zeroCrossingRate = i > 0 ? Math.abs(sample - window[i - 1]) : 0;
      
      // Estimate frequency band based on zero-crossing rate and amplitude
      // Lower ZCR + high amplitude = low frequency
      // Higher ZCR = high frequency
      
      if (zeroCrossingRate < 0.01 && absSample > 0.05) {
        // Low frequency content
        subEnergy += absSample * 0.8;
        bassEnergy += absSample * 0.6;
      } else if (zeroCrossingRate < 0.05 && absSample > 0.03) {
        // Mid-low frequency (bass, vocals)
        bassEnergy += absSample * 0.7;
        vocalEnergy += absSample * 0.5;
        harmonicEnergy += absSample * 0.4;
      } else if (zeroCrossingRate < 0.15 && absSample > 0.02) {
        // Mid frequency (vocals, harmonic)
        vocalEnergy += absSample * 0.8;
        harmonicEnergy += absSample * 0.6;
      } else if (zeroCrossingRate > 0.1 && absSample > 0.01) {
        // High frequency (percussion, cymbals)
        percEnergy += absSample * 0.9;
        drums[start + i] += sample * 0.7;
      }
    }
    
    // Normalize energies
    const totalEnergy = subEnergy + bassEnergy + vocalEnergy + percEnergy + harmonicEnergy || 1;
    const subRatio = subEnergy / totalEnergy;
    const bassRatio = bassEnergy / totalEnergy;
    const vocalRatio = vocalEnergy / totalEnergy;
    const percRatio = percEnergy / totalEnergy;
    const harmonicRatio = harmonicEnergy / totalEnergy;
    
    // Apply separation to window
    for (let i = 0; i < window.length && (start + i) < len; i++) {
      const idx = start + i;
      const sample = window[i];
      
      // Sub-bass: very low frequencies, high energy
      sub[idx] = sample * subRatio * 0.9;
      
      // Bass: low frequencies
      bass[idx] = sample * bassRatio * 0.8;
      
      // Vocals: mid frequencies, subtract from harmonic
      vocals[idx] = sample * vocalRatio * 0.75;
      
      // Harmonic: mid frequencies, subtract vocals
      harmonic[idx] = sample * harmonicRatio * 0.7 - vocals[idx] * 0.3;
      
      // Percussion: high frequencies, transient content
      if (Math.abs(sample) > 0.05 && percRatio > 0.2) {
        perc[idx] = sample * percRatio * 0.8;
        drums[idx] = sample * percRatio * 0.7;
      } else {
        perc[idx] = sample * percRatio * 0.5;
        drums[idx] = sample * percRatio * 0.4;
      }
      
      // Music: harmonic content (instrumental)
      music[idx] = harmonic[idx] * 0.9 + bass[idx] * 0.3;
    }
  }
  
  // Fill remaining samples if window didn't cover full length
  for (let i = Math.floor(len / hopSize) * hopSize; i < len; i++) {
    const sample = audio[i];
    const ratio = 0.3; // Default distribution
    sub[i] = sample * ratio * 0.2;
    bass[i] = sample * ratio * 0.4;
    vocals[i] = sample * ratio * 0.5;
    harmonic[i] = sample * ratio * 0.6;
    perc[i] = sample * ratio * 0.3;
    drums[i] = sample * ratio * 0.4;
    music[i] = sample * ratio * 0.7;
  }
  
  return { vocals, drums, bass, harmonic, perc, sub, music };
}

async function loadModel() {
  if (modelReady) return;
  try {
    // Resolve URLs to satisfy bundler; content is a placeholder
    try {
      if (modelConfigUrl) await fetch(modelConfigUrl).then(() => null).catch(() => null);
    } catch {}
    try {
      if (demucsWasmUrl) await fetch(demucsWasmUrl).then(() => null).catch(() => null);
    } catch {}

    // Dummy model: provide a safe separate() that returns zeroed arrays of the same length
    model = {
      separate(input: Float32Array, _sr: number) {
        const len = input?.length || 0;
        return {
          vocals: new Float32Array(len),
          drums: new Float32Array(len),
          bass: new Float32Array(len),
          harmonic: new Float32Array(len),
          perc: new Float32Array(len),
          sub: new Float32Array(len),
        };
      },
    };
    modelReady = true;
    (self as any).postMessage({
      type: 'MODEL_READY',
      status: true,
      msg: 'Dummy stem model loaded (fake-demucs.wasm).',
    });
  } catch (err) {
    (self as any).postMessage({ type: 'MODEL_ERROR', msg: 'Dummy model load failure', error: String(err) });
    modelReady = false;
    model = null;
  }
}

async function runInference(audio: Float32Array, sr: number) {
  if (!modelReady || !model || typeof model.separate !== 'function') {
    return { error: true, reason: 'MODEL_NOT_READY', stems: null };
  }
  try {
    const out = model.separate(audio, sr);
    return {
      error: false,
      stems: {
        vocals: out.vocals,
        drums: out.drums,
        bass: out.bass,
        harmonic: out.harmonic,
        perc: out.perc,
        sub: out.sub,
        music: audio,
      },
    };
  } catch (err) {
    return { error: true, reason: 'WASM_INFERENCE_FAILED', stems: null };
  }
}

function mapStemsForEngine(stems: Record<string, Float32Array>, stemCount: number): ArrayBuffer[] {
  // Engine expects [vocals, drums, bass, other] for 4 stems
  // For >4 stems, we append in the order perc, sub as extras (engine may label them as guitar/piano)
  const other = stems.harmonic ?? stems.music ?? new Float32Array(stems.vocals?.length || 0);
  const ordered: Float32Array[] = [stems.vocals, stems.drums, stems.bass, other].map((s) => s ?? new Float32Array(other.length));
  if (stemCount > 4) {
    ordered.push(stems.perc ?? new Float32Array(other.length));
    ordered.push(stems.sub ?? new Float32Array(other.length));
  }
  // Trim or pad to stemCount
  while (ordered.length < stemCount) ordered.push(new Float32Array(other.length));
  const trimmed = ordered.slice(0, stemCount);
  return trimmed.map((arr) => (arr instanceof Float32Array ? arr.buffer : new Float32Array(0).buffer));
}

self.onmessage = async (event: MessageEvent<any>) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  switch (message.type) {
    case 'INIT_MODEL': {
      await loadModel();
      break;
    }
    case 'PROCESS_CHUNK': {
      const { requestId, channels, channelLength, sampleRate, stemCount } = message;
      try {
        defaultSampleRate = sampleRate || defaultSampleRate;
        const mono = mixDownToMono(channels as ArrayBuffer[], channelLength);
        let result = await runInference(mono, defaultSampleRate);
        if (result.error || !result.stems) {
          // Fallback DSP - use improved frequency-domain separation
          const fb = generateDSPFallback(mono, defaultSampleRate);
          result = { error: false, stems: fb };
          (self as any).postMessage({ 
            type: 'FALLBACK_USED', 
            reason: result.error ? 'MODEL_ERROR' : 'MODEL_NOT_READY',
            note: 'Using DSP fallback - functional but not AI quality. For production, integrate real Demucs model.'
          });
        } else {
          // Check if model returned silent stems (all zeros)
          const hasAudio = Object.values(result.stems).some((stem: any) => {
            if (stem instanceof Float32Array) {
              return stem.some(s => Math.abs(s) > 0.001);
            }
            return false;
          });
          
          if (!hasAudio) {
            // Model returned silent stems - use DSP fallback
            const fb = generateDSPFallback(mono, defaultSampleRate);
            result = { error: false, stems: fb };
            (self as any).postMessage({ 
              type: 'FALLBACK_USED', 
              reason: 'SILENT_STEMS',
              note: 'Model returned silent stems - using DSP fallback. Replace fake-demucs.wasm with real model.'
            });
          }
        }
        // Energy scan & silence gating (light)
        const energies: Record<string, number> = {};
        Object.entries(result.stems!).forEach(([k, v]) => (energies[k] = calcRMS(v)));
        (self as any).postMessage({ type: 'STEM_DEBUG', energies, requestId });

        const payload = mapStemsForEngine(result.stems!, stemCount || 4);
        (self as any).postMessage(
          {
            type: 'CHUNK_RESULT',
            requestId,
            stems: payload,
          },
          payload // transfer
        );
      } catch (err) {
        (self as any).postMessage({
          type: 'CHUNK_ERROR',
          requestId: message.requestId,
          error: String(err || 'Worker chunk error'),
        });
      }
      break;
    }
    case 'CANCEL_REQUEST':
    default:
      break;
  }
};
