#!/usr/bin/env node

/**
 * Create a GitHub Pull Request via API
 * Usage: GITHUB_TOKEN=your_token node scripts/create-pr.js
 */

import https from 'node:https';

const OWNER = 'mixclubonline-del';
const REPO = 'mixx-glass-studio';
const BASE_BRANCH = 'main';
const HEAD_BRANCH = 'feat/studio-refactor-adaptive-layout';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.log('\n📝 To create a PR:');
  console.log('1. Get a GitHub Personal Access Token from: https://github.com/settings/tokens');
  console.log('2. Run: GITHUB_TOKEN=your_token node scripts/create-pr.js');
  console.log('\n🌐 Or create manually at:');
  console.log(`   https://github.com/${OWNER}/${REPO}/compare/${BASE_BRANCH}...${HEAD_BRANCH}?expand=1`);
  process.exit(1);
}

const prData = JSON.stringify({
  title: 'feat: Complete Studio Refactor with Adaptive Layout, Stem Separation, and Auto-Save Fixes',
  body: `## Major Features
- ✅ Adaptive layout system with platform detection and responsive breakpoints
- ✅ Flow Console with Compact, Matrix, and Analyzer view modes
- ✅ Professional track headers and adaptive waveform components
- ✅ Revolutionary stem separation engine with quantum processing
- ✅ External plugin system integration
- ✅ Rsbuild configuration for parallel build support

## Auto-Save & Auto-Pull System Fixes
- ✅ Fixed consumer count leaks in useAutoSave and useAutoPull hooks
- ✅ Prevented multiple components from overwriting singleton state getter
- ✅ Added proper error handling for initialization failures
- ✅ Ensured cleanup always removes consumers even if init fails
- ✅ Fixed keyboard shortcut promise rejection handling
- ✅ Corrected Git command exit code checking in Rust backend

## Component Architecture
- Removed unused placeholder components (Grid, Playhead, Timeline, Track, etc.)
- Added StemDebugHUD for real-time stem processing visualization
- Added ProfessionalTrackHeader and AdaptiveWaveformHeader
- Implemented Flow Console header and multiple view modes

## Core Systems
- Musical context-aware stem engine
- Quantum transformer stem engine
- Stem separation exporter and snapshot system
- Five pillars post-processing integration

## Documentation
- Updated README with comprehensive studio documentation
- Added migration and integration documentation
- Documented stem separation training and setup processes

**Files Changed:** 159 files (23,551 insertions, 515 deletions)`,
  head: HEAD_BRANCH,
  base: BASE_BRANCH
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${OWNER}/${REPO}/pulls`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(prData, 'utf-8'),
    'Authorization': `token ${GITHUB_TOKEN}`,
    'User-Agent': 'Node.js PR Creator'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      const pr = JSON.parse(data);
      console.log('✅ Pull Request created successfully!');
      console.log(`\n🔗 PR URL: ${pr.html_url}`);
      console.log(`\n📊 PR #${pr.number}: ${pr.title}`);
    } else {
      console.error(`❌ Failed to create PR. Status: ${res.statusCode}`);
      console.error('Response:', data);
      
      if (res.statusCode === 422) {
        const error = JSON.parse(data);
        if (error.errors && error.errors.some(e => e.message && e.message.includes('already exists'))) {
          console.log('\n💡 A PR for this branch may already exist. Check:');
          console.log(`   https://github.com/${OWNER}/${REPO}/pulls`);
        }
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error creating PR:', error.message);
});

req.write(prData);
req.end();

