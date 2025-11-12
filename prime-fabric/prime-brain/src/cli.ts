#!/usr/bin/env ts-node-esm
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { sanitizeSnapshots } from './sanitizeSnapshot.js';
import { buildDataset } from './datasetBuilder.js';
import { trainPrimeBrain } from './trainPrimeBrain.js';
import { evaluateDataset } from './evaluation.js';
import { RawPrimeBrainSnapshotSchema, SanitizedPrimeBrainRecordSchema } from './schema.js';

const program = new Command();

async function readJsonFile(filePath: string) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function readJsonlFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function writeJsonlFile(filePath: string, rows: unknown[]) {
  const lines = rows.map((row) => JSON.stringify(row));
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf-8');
}

async function loadRawSnapshots(inputPath: string) {
  const stats = await fs.stat(inputPath);
  let rawSnapshots: unknown[] = [];

  if (stats.isDirectory()) {
    const files = (await fs.readdir(inputPath)).filter((file) => file.endsWith('.json') || file.endsWith('.jsonl'));
    for (const file of files) {
      const filePath = path.join(inputPath, file);
      if (file.endsWith('.jsonl')) {
        rawSnapshots.push(...(await readJsonlFile(filePath)));
      } else {
        const json = await readJsonFile(filePath);
        rawSnapshots.push(...(Array.isArray(json) ? json : [json]));
      }
    }
  } else if (inputPath.endsWith('.jsonl')) {
    rawSnapshots = await readJsonlFile(inputPath);
  } else {
    const json = await readJsonFile(inputPath);
    rawSnapshots = Array.isArray(json) ? json : [json];
  }
  return rawSnapshots.map((snapshot) => RawPrimeBrainSnapshotSchema.parse(snapshot));
}

async function sanitizeInputToOutput(inputPath: string, outputPath: string) {
  const validatedRaw = await loadRawSnapshots(inputPath);
  const sanitized = sanitizeSnapshots(validatedRaw);
  await writeJsonlFile(outputPath, sanitized);
  console.log(chalk.green(`Sanitized ${sanitized.length} records → ${outputPath}`));
  return sanitized.length;
}

async function loadSanitizedRecords(inputPath: string) {
  const sanitized = await readJsonlFile(inputPath);
  return sanitized.map((record) => SanitizedPrimeBrainRecordSchema.parse(record));
}

program.name('prime-brain-fabric').description('Prime Fabric data and training utilities for Prime Brain');

program
  .command('sanitize')
  .description('Sanitize raw Studio snapshots into Fabric-ready records')
  .requiredOption('--input <path>', 'Path to raw snapshot JSON/JSONL file or directory')
  .requiredOption('--output <path>', 'Destination JSONL file for sanitized records')
  .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    await sanitizeInputToOutput(inputPath, outputPath);
  });

program
  .command('dataset')
  .description('Build training datasets from sanitized records')
  .requiredOption('--input <path>', 'Sanitized records JSONL file')
  .requiredOption('--outputDir <path>', 'Artifacts output directory')
  .option('--runLabel <label>', 'Label prefix for dataset run', 'prime-brain')
  .option('--trainRatio <value>', 'Train split ratio', (value) => Number(value), 0.9)
  .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.outputDir);
    const validated = await loadSanitizedRecords(inputPath);
    const manifest = await buildDataset({
      records: validated,
      outputDir,
      runLabel: options.runLabel,
      trainRatio: options.trainRatio,
    });
    console.log(chalk.green(`Dataset built: ${manifest.runId}`));
  });

program
  .command('train')
  .description('Fine-tune Prime Brain model on a dataset run')
  .requiredOption('--datasetDir <path>', 'Directory containing dataset run (train.jsonl, validation.jsonl)')
  .requiredOption('--outputDir <path>', 'Directory to store model checkpoints')
  .option('--baseModel <model>', 'Base model checkpoint', 'google/gemma-2b-it')
  .option('--maxSteps <number>', 'Maximum training steps', (value) => Number(value), 300)
  .option('--learningRate <number>', 'Learning rate', (value) => Number(value), 2e-5)
  .option('--batchSize <number>', 'Per-device batch size', (value) => Number(value), 4)
  .option('--gradientAccumulation <number>', 'Gradient accumulation steps', (value) => Number(value), 4)
  .option('--pythonPath <path>', 'Python interpreter path')
  .action(async (options) => {
    await trainPrimeBrain({
      datasetDir: path.resolve(options.datasetDir),
      outputDir: path.resolve(options.outputDir),
      baseModel: options.baseModel,
      maxSteps: options.maxSteps,
      learningRate: options.learningRate,
      batchSize: options.batchSize,
      gradientAccumulation: options.gradientAccumulation,
      pythonPath: options.pythonPath,
    });
  });

program
  .command('evaluate')
  .description('Run regression checks on dataset samples')
  .requiredOption('--datasetDir <path>', 'Dataset run directory')
  .requiredOption('--outputDir <path>', 'Evaluation output directory')
  .action(async (options) => {
    await evaluateDataset({
      datasetDir: path.resolve(options.datasetDir),
      outputDir: path.resolve(options.outputDir),
    });
  });

program
  .command('run')
  .description('Execute sanitize → dataset → train → evaluate pipeline')
  .requiredOption('--snapshots <path>', 'Path to raw snapshot JSON/JSONL or directory')
  .requiredOption('--workspace <path>', 'Workspace directory to store outputs')
  .option('--baseModel <model>', 'Base model checkpoint', 'google/gemma-2b-it')
  .option('--trainRatio <number>', 'Train split ratio', (value) => Number(value), 0.9)
  .option('--maxSteps <number>', 'Maximum training steps', (value) => Number(value), 300)
  .action(async (options) => {
    const workspace = path.resolve(options.workspace);
    const rawPath = path.resolve(options.snapshots);
    await fs.ensureDir(workspace);

    const sanitizedPath = path.join(workspace, 'sanitized.jsonl');
    const datasetRoot = path.join(workspace, 'datasets');
    const modelRoot = path.join(workspace, 'weights');
    const evaluationRoot = path.join(workspace, 'reports');

    await sanitizeInputToOutput(rawPath, sanitizedPath);
    const sanitizedRecords = await loadSanitizedRecords(sanitizedPath);
    await buildDataset({
      records: sanitizedRecords,
      outputDir: datasetRoot,
      runLabel: 'prime-brain',
      trainRatio: options.trainRatio,
    });

    const datasetDirs = (await fs.readdir(datasetRoot)).map((dir) => path.join(datasetRoot, dir));
    const latestDataset = datasetDirs.sort().pop();
    if (!latestDataset) {
      throw new Error('No dataset directory found after build.');
    }

    await trainPrimeBrain({
      datasetDir: latestDataset,
      outputDir: modelRoot,
      baseModel: options.baseModel,
      maxSteps: options.maxSteps,
    });

    await evaluateDataset({
      datasetDir: latestDataset,
      outputDir: evaluationRoot,
    });
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});

