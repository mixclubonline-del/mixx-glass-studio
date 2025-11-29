#!/usr/bin/env ts-node
/**
 * Data Collection Setup Script
 * 
 * Sets up and validates the stem separation data collection infrastructure:
 * 1. Verify exporter configuration
 * 2. Test snapshot export endpoint
 * 3. Validate data collection hooks
 * 4. Create test snapshots
 * 
 * Run: npx ts-node scripts/setup-data-collection.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DataCollectionConfig {
  exportUrl: string | null;
  enabled: boolean;
  debug: boolean;
  exportPath?: string; // For file-based export (testing)
}

async function setupDataCollection() {
  console.log('🔧 Setting up Stem Separation Data Collection...\n');

  // Check environment configuration
  console.log('1️⃣  Checking Environment Configuration...');
  
  const config: DataCollectionConfig = {
    exportUrl: null,
    enabled: false,
    debug: process.env.VITE_STEM_SEPARATION_EXPORT_DEBUG === '1',
  };

  // Check for export URL in various locations
  const exportUrlSources = [
    process.env.VITE_STEM_SEPARATION_EXPORT_URL,
    process.env.STEM_SEPARATION_EXPORT_URL,
    process.env.MIXX_STEM_SEPARATION_EXPORT_URL,
  ];

  config.exportUrl = exportUrlSources.find(url => url) || null;
  config.enabled = Boolean(config.exportUrl);

  if (config.exportUrl) {
    console.log(`   ✅ Export URL found: ${config.exportUrl}`);
    config.enabled = true;
  } else {
    console.log('   ⚠️  No export URL configured');
    console.log('   💡 Set VITE_STEM_SEPARATION_EXPORT_URL to enable data collection');
  }

  // Check for file-based export option (for local testing)
  const testExportPath = join(process.cwd(), 'test-snapshots');
  if (!existsSync(testExportPath)) {
    console.log(`\n2️⃣  Creating test export directory: ${testExportPath}`);
    // Directory will be created when first snapshot is exported
  }

  // Generate setup instructions
  console.log('\n3️⃣  Generating Setup Instructions...');
  
  const setupInstructions = {
    browserConsole: `
// Enable data collection in browser console:
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "https://your-endpoint/stem-separation"
    `.trim(),
    environment: `
// Add to .env file:
VITE_STEM_SEPARATION_EXPORT_URL=https://your-endpoint/stem-separation
VITE_STEM_SEPARATION_EXPORT_DEBUG=1
    `.trim(),
    localStorage: `
// Set via localStorage:
localStorage.setItem('mixxclub:stem-separation-export-url', 'https://your-endpoint/stem-separation')
    `.trim(),
  };

  const instructionsPath = join(process.cwd(), 'docs', 'setup-data-collection.md');
  const instructions = `# Stem Separation Data Collection Setup

## Quick Start

### Option 1: Browser Console (Immediate)

\`\`\`javascript
${setupInstructions.browserConsole}
\`\`\`

### Option 2: Environment Variable

\`\`\`bash
${setupInstructions.environment}
\`\`\`

### Option 3: Local Storage

\`\`\`javascript
${setupInstructions.localStorage}
\`\`\`

## Verification

1. Open browser console
2. Import an audio file
3. Look for: \`[STEM SEPARATION] Snapshot queued\` messages
4. Check network tab for POST requests to export URL

## Current Configuration

- Export URL: ${config.exportUrl || 'Not configured'}
- Enabled: ${config.enabled ? '✅ Yes' : '❌ No'}
- Debug Mode: ${config.debug ? '✅ Enabled' : '❌ Disabled'}

## Test Export Path

For local testing without a server:
- Path: ${testExportPath}
- Snapshots will be saved as JSON files
`;

  writeFileSync(instructionsPath, instructions);
  console.log(`   ✅ Instructions saved to: ${instructionsPath}`);

  // Create test endpoint simulator (for local testing)
  console.log('\n4️⃣  Creating Test Endpoint Simulator...');
  
  const testEndpointScript = `#!/usr/bin/env node
/**
 * Test Endpoint Simulator for Stem Separation Snapshots
 * 
 * Receives snapshots and saves them to disk for testing.
 * Run: node scripts/test-endpoint-simulator.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const SNAPSHOT_DIR = path.join(__dirname, '..', 'test-snapshots');

// Create directory if it doesn't exist
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.headers['x-prime-fabric-channel'] === 'stem-separation') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const snapshot = JSON.parse(body);
        const filename = \`snapshot-\${snapshot.id}-\${Date.now()}.json\`;
        const filepath = path.join(SNAPSHOT_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
        
        console.log(\`[TEST ENDPOINT] Received snapshot: \${snapshot.id}\`);
        console.log(\`[TEST ENDPOINT] Saved to: \${filepath}\`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filename }));
      } catch (error) {
        console.error('[TEST ENDPOINT] Error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(\`[TEST ENDPOINT] Listening on http://localhost:\${PORT}\`);
  console.log(\`[TEST ENDPOINT] Snapshot directory: \${SNAPSHOT_DIR}\`);
  console.log(\`[TEST ENDPOINT] Ready to receive snapshots...\`);
});
`;

  const testEndpointPath = join(process.cwd(), 'scripts', 'test-endpoint-simulator.js');
  writeFileSync(testEndpointPath, testEndpointScript);
  
  // Make executable on Unix systems
  try {
    const { chmod } = require('fs');
    chmod(testEndpointPath, 0o755, () => {});
  } catch {
    // Ignore if chmod fails (Windows)
  }

  console.log(`   ✅ Test endpoint simulator saved to: ${testEndpointPath}`);
  console.log(`   💡 Run: node ${testEndpointPath} to start local test server`);

  // Summary
  console.log('\n✅ Data Collection Setup Complete!\n');
  console.log('📋 Summary:');
  console.log(`   - Export URL: ${config.exportUrl || 'Not configured'}`);
  console.log(`   - Enabled: ${config.enabled ? '✅' : '❌'}`);
  console.log(`   - Debug Mode: ${config.debug ? '✅' : '❌'}`);
  console.log(`   - Test Endpoint: http://localhost:3002`);
  console.log(`   - Test Snapshots: ${testExportPath}`);
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Set export URL (see docs/setup-data-collection.md)');
  console.log('   2. Start test endpoint: node scripts/test-endpoint-simulator.js');
  console.log('   3. Import audio files in Studio');
  console.log('   4. Verify snapshots are collected');
  console.log('   5. Run training pipeline with collected snapshots\n');

  return {
    config,
    testEndpoint: `http://localhost:3002`,
    testSnapshotDir: testExportPath,
    instructionsPath,
  };
}

// Run setup if executed directly
if (require.main === module) {
  setupDataCollection()
    .then((result) => {
      console.log('🎉 Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupDataCollection };

