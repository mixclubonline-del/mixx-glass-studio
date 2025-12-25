#!/usr/bin/env node
import fs from 'fs'
import { spawn } from 'child_process'

const RUST_DIR = 'src-wasm'
const BUILD_CMD = 'wasm-pack'
const BUILD_ARGS = ['build', '--dev', '--target', 'bundler', '--out-dir', '../src/audio/wasm/pkg']
let timer = null
let running = false

function runBuild() {
  if (running) {
    console.log('[wasm-watch] build already running, skipping')
    return
  }
  running = true
  console.log('[wasm-watch] Starting wasm-pack build (dev)...')
  const proc = spawn(BUILD_CMD, BUILD_ARGS, { cwd: RUST_DIR, stdio: 'inherit' })

  proc.on('error', (err) => {
    console.error('[wasm-watch] failed to start build', err)
    running = false
  })

  proc.on('close', (code) => {
    if (code === 0) {
      console.log('[wasm-watch] wasm-pack build finished')
    } else {
      console.error('[wasm-watch] wasm-pack build failed with code', code)
    }
    running = false
  })
}

function scheduleBuild() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(runBuild, 150)
}

async function main() {
  // initial build
  runBuild()

  const watchPaths = [`${RUST_DIR}/src`, `${RUST_DIR}/Cargo.toml`]

  for (const p of watchPaths) {
    try {
      fs.watch(p, { recursive: true }, (eventType, filename) => {
        console.log(`[wasm-watch] ${eventType} ${p}/${filename} — scheduling rebuild`)
        scheduleBuild()
      })
    } catch (err) {
      console.error('[wasm-watch] watch error for', p, err)
    }
  }

  process.on('SIGINT', () => {
    console.log('[wasm-watch] stopping watcher')
    process.exit(0)
  })
}

main().catch((e) => {
  console.error('[wasm-watch] fatal error', e)
  process.exit(1)
})
