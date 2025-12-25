# Development Setup (short)

## WASM (Rust DSP) Quickstart

Prerequisites:
- Rust (stable) and `rustup`
- Add the WASM target: `rustup target add wasm32-unknown-unknown`
- Install `wasm-pack` (https://rustwasm.github.io/wasm-pack/): `cargo install wasm-pack`
- (Optional) `cargo-watch` for fast rebuilds: `cargo install cargo-watch`
- (Optional) `wasm-opt` (Binaryen) for optimizing produced `.wasm`

Scripts added in `package.json`:
- `npm run build:wasm` — build release WASM into `src/audio/wasm/pkg`
- `npm run dev:wasm` — build dev WASM
- `npm run watch:wasm` — continuous rebuild using `cargo watch`
- `npm run watch:wasm:node` — continuous rebuild using a Node watcher (`scripts/watch-wasm.js`) when `cargo-watch` cannot be installed
- `npm run dev:wasm:concurrent` — run `watch:wasm` and `dev` in parallel (requires `concurrently` package)
- `npm run dev:wasm:concurrent:node` — run `watch:wasm:node` and `dev` in parallel (useful on systems where `cargo-watch` cannot be installed)

Recommended local workflow:

1. In one terminal, start continuous wasm builds:

```bash
npm run watch:wasm
```

2. In another terminal, start the web dev server:

```bash
npm run dev
```

3. The frontend dynamically loads the wasm via `src/audio/wasm/loader.ts`.

CI notes:
- Install Rust and add `wasm32-unknown-unknown` target
- Install `wasm-pack` and run `npm run build:wasm` before `npm run build`
- Optionally run `wasm-opt` to minimize size
