/**
 * CLaRa Testing & Prototype Validation
 * 
 * Test suite for CLaRa embedding generation and vector storage.
 * Tests compression ratios, similarity search, and integration with Mixx Recall.
 */

import { getClaraEmbedding } from './ClaraEmbedding';
import { getClaraVectorStorage } from './ClaraVectorStorage';
import { getMixxRecallContext } from './MixxRecallContext';

/**
 * Test CLaRa embedding generation
 */
export async function testClaraEmbedding() {
  console.log('🧪 Testing CLaRa Embedding Generation...\n');

  const clara = getClaraEmbedding();

  // Test 1: Basic text embedding
  console.log('Test 1: Basic text embedding');
  const text1 = 'Hip-hop track in C minor at 140 BPM with trap drums and 808 bass';
  const result1 = await clara.generateEmbedding(text1);
  console.log(`  Original size: ${result1.originalSizeBytes} bytes`);
  console.log(`  Compressed size: ${result1.compressedSizeBytes} bytes`);
  console.log(`  Compression ratio: ${result1.compressionRatio.toFixed(2)}x`);
  console.log(`  Dimensions: ${result1.dimensions}\n`);

  // Test 2: Mixx Recall compression
  console.log('Test 2: Mixx Recall compression');
  const mixxRecallData = {
    category: 'workflow',
    genre: 'trap',
    bpm: 140,
    key: 'Cm',
    plugins: ['MixxTune', 'VelvetCurve', 'HarmonicLattice'],
    presets: [
      { name: 'Trap Vocal Chain', plugin: 'MixxTune' },
      { name: '808 Sub', plugin: 'VelvetFloor' },
    ],
  };
  const result2 = await clara.compressMixxRecall(mixxRecallData);
  console.log(`  Original size: ${result2.originalSizeBytes} bytes`);
  console.log(`  Compressed size: ${result2.compressedSizeBytes} bytes`);
  console.log(`  Compression ratio: ${result2.compressionRatio.toFixed(2)}x\n`);

  // Test 3: Project snapshot compression
  console.log('Test 3: Project snapshot compression');
  const projectData = {
    name: 'My Trap Beat',
    bpm: 140,
    key: 'Cm',
    genre: 'trap',
    projectData: {
      tracks: Array(8).fill({ name: 'Track', plugins: [] }),
      regions: Array(24).fill({ name: 'Region' }),
      plugins: { track1: ['MixxTune'], track2: ['VelvetCurve'] },
    },
  };
  const result3 = await clara.compressProjectSnapshot(projectData);
  console.log(`  Original size: ${result3.originalSizeBytes} bytes`);
  console.log(`  Compressed size: ${result3.compressedSizeBytes} bytes`);
  console.log(`  Compression ratio: ${result3.compressionRatio.toFixed(2)}x\n`);

  // Test 4: Musical context compression
  console.log('Test 4: Musical context compression');
  const musicalContext = {
    key: 'Cm',
    scale: 'natural-minor',
    chord: 'Cm',
    bpm: 140,
    chromagram: [0.8, 0.1, 0.3, 0.2, 0.7, 0.4, 0.1, 0.5, 0.2, 0.3, 0.1, 0.4],
    harmonicTension: 0.65,
  };
  const result4 = await clara.compressMusicalContext(musicalContext);
  console.log(`  Original size: ${result4.originalSizeBytes} bytes`);
  console.log(`  Compressed size: ${result4.compressedSizeBytes} bytes`);
  console.log(`  Compression ratio: ${result4.compressionRatio.toFixed(2)}x\n`);

  // Test 5: Similarity search
  console.log('Test 5: Similarity search');
  const query1 = await clara.generateEmbedding('Trap beat at 140 BPM in C minor');
  const query2 = await clara.generateEmbedding('Hip-hop track in C minor at 140 BPM');
  const similarity = clara.cosineSimilarity(query1.embedding, query2.embedding);
  console.log(`  Similarity between similar queries: ${similarity.toFixed(4)}`);

  const query3 = await clara.generateEmbedding('Jazz ballad in F major at 60 BPM');
  const similarity2 = clara.cosineSimilarity(query1.embedding, query3.embedding);
  console.log(`  Similarity between different genres: ${similarity2.toFixed(4)}\n`);

  return {
    textEmbedding: result1,
    mixxRecall: result2,
    projectSnapshot: result3,
    musicalContext: result4,
  };
}

/**
 * Test vector storage
 */
export async function testVectorStorage() {
  console.log('🧪 Testing Vector Storage...\n');

  const storage = getClaraVectorStorage();
  const clara = getClaraEmbedding();

  // Store multiple embeddings
  console.log('Storing embeddings...');
  const texts = [
    'Trap beat in C minor at 140 BPM',
    'Hip-hop track in C minor at 140 BPM with 808',
    'R&B ballad in F major at 70 BPM',
    'Drill beat in D minor at 150 BPM',
    'Afrobeat in A major at 120 BPM',
  ];

  const storedIds: string[] = [];

  for (const text of texts) {
    const embedding = await clara.generateEmbedding(text);
    const id = await storage.storeEmbedding(embedding, {
      type: 'mixx_recall',
      originalText: text,
    });
    storedIds.push(id);
    console.log(`  Stored: ${text.substring(0, 40)}... (ID: ${id.substring(0, 8)})`);
  }

  console.log('');

  // Test similarity search
  console.log('Testing similarity search...');
  const queryText = 'Trap music in C minor at 140 BPM';
  const queryEmbedding = await clara.generateEmbedding(queryText);
  
  const similar = await storage.findSimilar(
    queryEmbedding.embedding,
    'mixx_recall',
    0.5, // Lower threshold for testing
    5
  );

  console.log(`  Query: "${queryText}"`);
  console.log(`  Found ${similar.length} similar items:`);
  for (const item of similar) {
    const text = item.metadata.originalText || 'N/A';
    console.log(`    - ${text.substring(0, 50)}...`);
  }

  console.log('');

  // Get statistics
  const stats = await storage.getStats();
  console.log('Storage Statistics:');
  console.log(`  Total embeddings: ${stats.totalEmbeddings}`);
  console.log(`  Total size: ${(stats.totalSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`  Average compression: ${stats.averageCompressionRatio.toFixed(2)}x`);
  console.log(`  By type:`, stats.byType);

  return { storedIds, stats };
}

/**
 * Test integration with Mixx Recall
 */
export async function testMixxRecallIntegration() {
  console.log('🧪 Testing Mixx Recall Integration...\n');

  const clara = getClaraEmbedding();
  const storage = getClaraVectorStorage();
  const mixxRecall = getMixxRecallContext();

  // Get existing Mixx Recall data
  const context = getMixxRecallContext();
  console.log('Current Mixx Recall context:');
  console.log(JSON.stringify(context, null, 2));
  console.log('');

  // Compress and store Mixx Recall patterns
  if (context.preferredGenres && context.preferredGenres.length > 0) {
    const mixxData = {
      category: 'genre',
      genre: context.preferredGenres[0],
      bpm: context.typicalBPM,
      key: context.commonKeys?.[0],
      plugins: context.favoritePlugins,
      presets: context.commonPresets,
    };

    const compressed = await clara.compressMixxRecall(mixxData);
    const id = await storage.storeEmbedding(compressed, {
      type: 'mixx_recall',
      category: 'genre',
      originalText: JSON.stringify(mixxData),
    });

    console.log(`Compressed and stored Mixx Recall pattern:`);
    console.log(`  ID: ${id}`);
    console.log(`  Compression: ${compressed.compressionRatio.toFixed(2)}x`);
    console.log(`  Original: ${compressed.originalSizeBytes} bytes`);
    console.log(`  Compressed: ${compressed.compressedSizeBytes} bytes`);
  }

  return true;
}

/**
 * Run all tests
 */
export async function runClaraTests() {
  console.log('🚀 Running CLaRa Prototype Tests\n');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // Test 1: Embedding generation
    const embeddingResults = await testClaraEmbedding();
    console.log('');

    // Test 2: Vector storage
    const storageResults = await testVectorStorage();
    console.log('');

    // Test 3: Mixx Recall integration
    await testMixxRecallIntegration();
    console.log('');

    console.log('=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('');

    return {
      success: true,
      embeddingResults,
      storageResults,
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Export for use in scripts
if (import.meta.hot) {
  // Development mode - expose for testing
  (window as any).runClaraTests = runClaraTests;
}
