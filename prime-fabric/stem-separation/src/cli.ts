/**
 * CLI Orchestrator for Stem Separation Training Pipeline
 * 
 * Runs the complete end-to-end training workflow:
 * 1. Sanitize snapshots
 * 2. Engineer features
 * 3. Build dataset
 * 4. Train model
 * 5. Evaluate results
 */

import fs from 'fs-extra';
import path from 'node:path';
import { sanitizeStemSnapshot } from './sanitizeSnapshot.js';
import { buildStemSeparationDataset } from './datasetBuilder.js';
import { evaluateSeparation } from './evaluation.js';
import { validateSnapshot, type StemSeparationSnapshot } from './schema.js';
import { spawn } from 'child_process';

interface TrainingCLIOptions {
  snapshotDir: string;
  outputDir: string;
  runLabel?: string;
  trainRatio?: number;
  skipTraining?: boolean;
  skipEvaluation?: boolean;
}

/**
 * Load all snapshots from directory
 */
function loadSnapshots(snapshotDir: string): StemSeparationSnapshot[] {
  const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
  const snapshots: StemSeparationSnapshot[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(snapshotDir, file), 'utf-8');
      const snapshot = JSON.parse(content);
      
      if (validateSnapshot(snapshot)) {
        snapshots.push(snapshot);
      } else {
        console.warn(`[CLI] Invalid snapshot: ${file}`);
      }
    } catch (error) {
      console.error(`[CLI] Error loading ${file}:`, error);
    }
  }
  
  return snapshots;
}

/**
 * Sanitize all snapshots
 */
function sanitizeAllSnapshots(snapshots: StemSeparationSnapshot[]) {
  console.log(`[CLI] Sanitizing ${snapshots.length} snapshots...`);
  
  const sanitized = snapshots
    .map(snapshot => sanitizeStemSnapshot(snapshot))
    .filter((record): record is NonNullable<typeof record> => record !== null);
  
  console.log(`[CLI] Sanitized ${sanitized.length} snapshots`);
  return sanitized;
}

/**
 * Run Python training script
 */
async function runTrainingScript(
  datasetDir: string,
  outputDir: string,
  config?: Record<string, any>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'training', 'train_stem_separation.py');
    const args = [
      scriptPath,
      '--dataset', datasetDir,
      '--output', outputDir,
    ];
    
    if (config) {
      const configPath = path.join(outputDir, 'training_config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      args.push('--config', configPath);
    }
    
    console.log(`[CLI] Running training script: python3 ${args.join(' ')}`);
    
    const python = spawn('python3', args, {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath),
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Training script exited with code ${code}`));
      }
    });
    
    python.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Evaluate trained model
 */
async function evaluateModel(
  sanitizedRecords: any[],
  outputDir: string
): Promise<void> {
  console.log('[CLI] Running evaluation...');
  
  const evaluations = sanitizedRecords.map(record => evaluateSeparation(record));
  
  // Calculate aggregate metrics
  const avgMetrics = {
    sdr: 0,
    sir: 0,
    sar: 0,
    overall: 0,
  };
  
  evaluations.forEach(evalResult => {
    avgMetrics.sdr += evalResult.metrics.sdr;
    avgMetrics.sir += evalResult.metrics.sir;
    avgMetrics.sar += evalResult.metrics.sar;
    avgMetrics.overall += evalResult.metrics.overall;
  });
  
  const count = evaluations.length;
  avgMetrics.sdr /= count;
  avgMetrics.sir /= count;
  avgMetrics.sar /= count;
  avgMetrics.overall /= count;
  
  // Save evaluation report
  const report = {
    timestamp: new Date().toISOString(),
    aggregateMetrics: avgMetrics,
    individualEvaluations: evaluations,
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'evaluation_report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('[CLI] Evaluation complete:');
  console.log(`  Average SDR: ${avgMetrics.sdr.toFixed(2)} dB`);
  console.log(`  Average SIR: ${avgMetrics.sir.toFixed(2)} dB`);
  console.log(`  Average SAR: ${avgMetrics.sar.toFixed(2)} dB`);
  console.log(`  Overall Quality: ${(avgMetrics.overall * 100).toFixed(1)}%`);
}

/**
 * Main CLI runner
 */
export async function runTrainingPipeline(options: TrainingCLIOptions): Promise<void> {
  const {
    snapshotDir,
    outputDir,
    runLabel,
    trainRatio = 0.8,
    skipTraining = false,
    skipEvaluation = false,
  } = options;
  
  console.log('[CLI] ========================================');
  console.log('[CLI] Revolutionary Stem Separation Training');
  console.log('[CLI] ========================================');
  
  // Step 1: Load snapshots
  console.log('\n[CLI] Step 1: Loading snapshots...');
  const snapshots = loadSnapshots(snapshotDir);
  console.log(`[CLI] Loaded ${snapshots.length} snapshots`);
  
  if (snapshots.length === 0) {
    throw new Error('No snapshots found in directory');
  }
  
  // Step 2: Sanitize
  console.log('\n[CLI] Step 2: Sanitizing snapshots...');
  const sanitized = sanitizeAllSnapshots(snapshots);
  
  if (sanitized.length === 0) {
    throw new Error('No valid snapshots after sanitization');
  }
  
  // Step 3: Build dataset
  console.log('\n[CLI] Step 3: Building dataset...');
  const datasetManifest = await buildStemSeparationDataset({
    records: sanitized,
    outputDir,
    runLabel,
    trainRatio,
  });
  
  const datasetDir = path.join(outputDir, runLabel || datasetManifest.runId);
  const trainingOutputDir = path.join(outputDir, runLabel || datasetManifest.runId, 'model');
  
  // Step 4: Train model
  if (!skipTraining) {
    console.log('\n[CLI] Step 4: Training model...');
    await runTrainingScript(datasetDir, trainingOutputDir);
  } else {
    console.log('\n[CLI] Step 4: Skipping training (--skip-training)');
  }
  
  // Step 5: Evaluate
  if (!skipEvaluation) {
    console.log('\n[CLI] Step 5: Evaluating model...');
    await evaluateModel(sanitized, trainingOutputDir);
  } else {
    console.log('\n[CLI] Step 5: Skipping evaluation (--skip-evaluation)');
  }
  
  console.log('\n[CLI] ========================================');
  console.log('[CLI] Training pipeline complete!');
  console.log(`[CLI] Output directory: ${trainingOutputDir}`);
  console.log('[CLI] ========================================');
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: ts-node cli.ts run --snapshotDir <dir> --outputDir <dir> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --snapshotDir <dir>     Directory containing snapshot JSON files');
    console.error('  --outputDir <dir>       Output directory for datasets and models');
    console.error('  --runLabel <label>      Optional label for this training run');
    console.error('  --trainRatio <0-1>      Train/validation split ratio (default: 0.8)');
    console.error('  --skip-training         Skip model training step');
    console.error('  --skip-evaluation       Skip evaluation step');
    process.exit(1);
  }
  
  const options: TrainingCLIOptions = {
    snapshotDir: '',
    outputDir: '',
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--snapshotDir':
        options.snapshotDir = args[++i];
        break;
      case '--outputDir':
        options.outputDir = args[++i];
        break;
      case '--runLabel':
        options.runLabel = args[++i];
        break;
      case '--trainRatio':
        options.trainRatio = parseFloat(args[++i]);
        break;
      case '--skip-training':
        options.skipTraining = true;
        break;
      case '--skip-evaluation':
        options.skipEvaluation = true;
        break;
    }
  }
  
  if (!options.snapshotDir || !options.outputDir) {
    console.error('Error: --snapshotDir and --outputDir are required');
    process.exit(1);
  }
  
  runTrainingPipeline(options).catch(error => {
    console.error('[CLI] Fatal error:', error);
    process.exit(1);
  });
}








