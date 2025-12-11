/**
 * Dataset Builder for Stem Separation Training
 * 
 * Assembles train/validation splits with proper manifests and versioning.
 */

import fs from 'fs-extra';
import hash from 'object-hash';
import path from 'node:path';
import { DateTime } from 'luxon';
import { buildTrainingPairs } from './featureEngineer.js';
import { SanitizedStemRecord } from './schema.js';

export interface DatasetBuildOptions {
  records: SanitizedStemRecord[];
  outputDir: string;
  runLabel?: string;
  trainRatio?: number;
}

export interface DatasetManifest {
  runId: string;
  createdAt: string;
  hash: string;
  counts: {
    totalRecords: number;
    train: number;
    validation: number;
  };
  classificationDistribution: Record<string, number>;
  sourceFiles?: string[];
}

function ensureDir(dir: string) {
  fs.ensureDirSync(dir);
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function splitRecords(records: SanitizedStemRecord[], ratio: number) {
  const shuffled = shuffle(records);
  const pivot = Math.floor(shuffled.length * ratio);
  return {
    train: shuffled.slice(0, pivot),
    validation: shuffled.slice(pivot),
  };
}

function toJsonlLines<T>(items: T[]): string {
  return items.map(item => JSON.stringify(item)).join('\n');
}

function countByClassification(records: SanitizedStemRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  records.forEach(record => {
    const cls = record.metadata.classification;
    counts[cls] = (counts[cls] || 0) + 1;
  });
  return counts;
}

/**
 * Build training dataset from sanitized records
 */
export async function buildStemSeparationDataset(
  options: DatasetBuildOptions
): Promise<DatasetManifest> {
  const {
    records,
    outputDir,
    runLabel = `run-${DateTime.now().toFormat('yyyy-MM-dd-HHmmss')}`,
    trainRatio = 0.8,
  } = options;

  const runDir = path.join(outputDir, runLabel);
  ensureDir(runDir);

  // Build training pairs
  const { inputs, targets, metadata } = buildTrainingPairs(records);

  if (inputs.length === 0) {
    throw new Error('No training pairs with ground truth found');
  }

  // Split into train/validation
  const split = splitRecords(
    records.filter((_, idx) => inputs[idx]),
    trainRatio
  );

  const trainIndices = new Set(
    split.train.map(record => records.indexOf(record))
  );

  const trainPairs = {
    inputs: inputs.filter((_, idx) => trainIndices.has(idx)),
    targets: targets.filter((_, idx) => trainIndices.has(idx)),
    metadata: metadata.filter((_, idx) => trainIndices.has(idx)),
  };

  const validationPairs = {
    inputs: inputs.filter((_, idx) => !trainIndices.has(idx)),
    targets: targets.filter((_, idx) => !trainIndices.has(idx)),
    metadata: metadata.filter((_, idx) => !trainIndices.has(idx)),
  };

  // Write datasets
  const trainDir = path.join(runDir, 'train');
  const validationDir = path.join(runDir, 'validation');
  ensureDir(trainDir);
  ensureDir(validationDir);

  // Write inputs
  fs.writeFileSync(
    path.join(trainDir, 'inputs.jsonl'),
    toJsonlLines(trainPairs.inputs.map(arr => Array.from(arr)))
  );
  fs.writeFileSync(
    path.join(validationDir, 'inputs.jsonl'),
    toJsonlLines(validationPairs.inputs.map(arr => Array.from(arr)))
  );

  // Write targets
  fs.writeFileSync(
    path.join(trainDir, 'targets.jsonl'),
    toJsonlLines(
      trainPairs.targets.map(target => ({
        vocals: target.vocals ? Array.from(target.vocals) : null,
        drums: target.drums ? Array.from(target.drums) : null,
        bass: target.bass ? Array.from(target.bass) : null,
        harmonic: target.harmonic ? Array.from(target.harmonic) : null,
        perc: target.perc ? Array.from(target.perc) : null,
        sub: target.sub ? Array.from(target.sub) : null,
      }))
    )
  );
  fs.writeFileSync(
    path.join(validationDir, 'targets.jsonl'),
    toJsonlLines(
      validationPairs.targets.map(target => ({
        vocals: target.vocals ? Array.from(target.vocals) : null,
        drums: target.drums ? Array.from(target.drums) : null,
        bass: target.bass ? Array.from(target.bass) : null,
        harmonic: target.harmonic ? Array.from(target.harmonic) : null,
        perc: target.perc ? Array.from(target.perc) : null,
        sub: target.sub ? Array.from(target.sub) : null,
      }))
    )
  );

  // Write metadata
  fs.writeFileSync(
    path.join(trainDir, 'metadata.jsonl'),
    toJsonlLines(trainPairs.metadata)
  );
  fs.writeFileSync(
    path.join(validationDir, 'metadata.jsonl'),
    toJsonlLines(validationPairs.metadata)
  );

  // Create manifest
  const manifest: DatasetManifest = {
    runId: runLabel,
    createdAt: DateTime.now().toISO(),
    hash: hash({ records, trainRatio }),
    counts: {
      totalRecords: records.length,
      train: trainPairs.inputs.length,
      validation: validationPairs.inputs.length,
    },
    classificationDistribution: countByClassification(records),
  };

  fs.writeFileSync(
    path.join(runDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`[DATASET] Built dataset: ${runLabel}`);
  console.log(`[DATASET] Train: ${manifest.counts.train}, Validation: ${manifest.counts.validation}`);

  return manifest;
}








