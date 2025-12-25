// Async loader shim for the Mixx DSP WASM package
// Usage: const { default: wasm } = await loadWasm();
// or const wasm = await loadWasm();

export async function loadWasm() {
  // Dynamic import ensures Vite loads the generated JS glue and .wasm asset from ./pkg
  try {
    const mod = await import('./pkg/mixx_dsp_wasm');
    // The wasm-pack generated glue may export default or named exports. Normalize.
    return (mod && (mod.default ?? mod));
  } catch (err) {
    console.error('Failed to load WASM module at ./pkg/mixx_dsp_wasm', err);
    throw err;
  }
}

export async function initWasm() {
  const wasm = await loadWasm();
  if (wasm && typeof wasm.init === 'function') {
    await wasm.init();
  }
  return wasm;
}
