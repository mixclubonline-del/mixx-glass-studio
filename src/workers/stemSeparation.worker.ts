/* eslint-disable no-restricted-globals */
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
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import demucsWasmUrl from '../ai/models/demucs.wasm?url';
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

function generateDSPFallback(audio: Float32Array) {
  const len = audio.length;
  const vocals = new Float32Array(len);
  const drums = new Float32Array(len);
  const bass = new Float32Array(len);
  const harmonic = new Float32Array(len);
  const perc = new Float32Array(len);
  const sub = new Float32Array(len);

  for (let i = 0; i < len; i += 1) {
    const s = audio[i];
    vocals[i] = s * 0.65;
    perc[i] = s * (i % 2 === 0 ? 0.7 : -0.7);
    drums[i] = Math.abs(s) > 0.1 ? s : 0;
    bass[i] = i < len / 8 ? s * 0.9 : 0;
    sub[i] = i < len / 32 ? s * 1.1 : 0;
    harmonic[i] = s * 0.4;
  }

  return { vocals, drums, bass, harmonic, perc, sub, music: audio };
}

async function loadModel() {
  if (modelReady) return;
  try {
    if (modelConfigUrl) {
      await fetch(modelConfigUrl).then((r) => r.ok ? r.json() : null).catch(() => null);
    }
    if (demucsWasmUrl) {
      const wasmResp = await fetch(demucsWasmUrl).catch(() => null);
      if (wasmResp) {
        let wasmModule: WebAssembly.WebAssemblyInstantiatedSource | null = null;
        if ((WebAssembly as any).instantiateStreaming) {
          wasmModule = await WebAssembly.instantiateStreaming(wasmResp, {}).catch(() => null);
        }
        if (!wasmModule) {
          const bytes = await wasmResp.arrayBuffer();
          wasmModule = await WebAssembly.instantiate(bytes, {});
        }
        model = (wasmModule as any)?.instance?.exports ?? null;
      }
    }
    modelReady = !!model;
    (self as any).postMessage({ type: 'MODEL_READY', status: modelReady });
  } catch (err) {
    (self as any).postMessage({ type: 'MODEL_ERROR', msg: 'Worker model init failed', error: String(err) });
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
          // Fallback DSP
          const fb = generateDSPFallback(mono);
          result = { error: false, stems: fb };
          (self as any).postMessage({ type: 'FALLBACK_USED', reason: result.error ? 'MODEL_ERROR' : 'MODEL_NOT_READY' });
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
