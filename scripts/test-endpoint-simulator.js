#!/usr/bin/env node
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
  console.log(`[TEST ENDPOINT] Created directory: ${SNAPSHOT_DIR}`);
}

let snapshotCount = 0;

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Prime-Fabric-Channel',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.headers['x-prime-fabric-channel'] === 'stem-separation') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const snapshot = JSON.parse(body);
        const filename = `snapshot-${snapshot.id}-${Date.now()}.json`;
        const filepath = path.join(SNAPSHOT_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
        snapshotCount++;
        
        console.log(`[TEST ENDPOINT] ✅ Received snapshot #${snapshotCount}: ${snapshot.id}`);
        console.log(`[TEST ENDPOINT]    Saved to: ${path.relative(process.cwd(), filepath)}`);
        console.log(`[TEST ENDPOINT]    Classification: ${snapshot.metadata?.classification || 'unknown'}`);
        console.log(`[TEST ENDPOINT]    Confidence: ${snapshot.metadata?.confidence || 0}`);
        
        // Handle CORS
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ success: true, filename, count: snapshotCount }));
      } catch (error) {
        console.error('[TEST ENDPOINT] ❌ Error:', error.message);
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404, {
      'Access-Control-Allow-Origin': '*',
    });
    res.end();
  }
});

server.listen(PORT, () => {
  console.log('\n🚀 TEST ENDPOINT SIMULATOR');
  console.log('============================');
  console.log(`📍 Listening on: http://localhost:${PORT}`);
  console.log(`📁 Snapshot directory: ${path.relative(process.cwd(), SNAPSHOT_DIR)}`);
  console.log(`🔧 Channel: stem-separation`);
  console.log('\n✅ Ready to receive snapshots...\n');
  
  console.log('💡 To enable in Studio:');
  console.log(`   window.__MIXX_STEM_SEPARATION_EXPORT_URL = "http://localhost:${PORT}"\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n[TEST ENDPOINT] Received ${snapshotCount} snapshots. Shutting down...`);
  server.close(() => {
    console.log('[TEST ENDPOINT] Server closed.');
    process.exit(0);
  });
});

