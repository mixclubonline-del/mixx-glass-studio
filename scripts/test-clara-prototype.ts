/**
 * CLaRa Prototype Test Script
 * 
 * Run this script to test CLaRa embedding generation and vector storage.
 * 
 * Usage:
 *   npm run test:clara
 *   or
 *   npx ts-node scripts/test-clara-prototype.ts
 */

import { runClaraTests } from '../src/ai/ClaraTest';

async function main() {
  console.log('CLaRa Prototype Testing\n');
  console.log('This script tests:');
  console.log('  1. Embedding generation and compression');
  console.log('  2. Vector storage and similarity search');
  console.log('  3. Integration with Mixx Recall');
  console.log('');

  const results = await runClaraTests();

  if (results.success) {
    console.log('\n📊 Summary:');
    console.log('  - Embedding generation: ✅');
    console.log('  - Vector storage: ✅');
    console.log('  - Mixx Recall integration: ✅');
    console.log('\n✨ Prototype is working! Ready for database integration.');
    process.exit(0);
  } else {
    console.error('\n❌ Tests failed:', results.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
