import fs from 'fs-extra';
import hash from 'object-hash';
import path from 'node:path';
import { DateTime } from 'luxon';
import { buildInstructionSamples } from './featureEngineer.js';
import { InstructionSample, SanitizedPrimeBrainRecord } from './schema.js';

export interface DatasetBuildOptions {
  records: SanitizedPrimeBrainRecord[];
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
    totalSamples: number;
    train: number;
    validation: number;
  };
  modeDistribution: Record<string, number>;
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

function splitSamples(samples: InstructionSample[], ratio: number) {
  const pivot = Math.floor(samples.length * ratio);
  return {
    train: samples.slice(0, pivot),
    validation: samples.slice(pivot),
  };
}

function toJsonlLines<T>(items: T[]) {
  return items.map((item) => JSON.stringify(item)).join('\n');
}

function countModes(samples: InstructionSample[]) {
  return samples.reduce<Record<string, number>>((acc, sample) => {
    acc[sample.mode] = (acc[sample.mode] ?? 0) + 1;
    return acc;
  }, {});
}

export async function buildDataset(options: DatasetBuildOptions): Promise<DatasetManifest> {
  const { records, outputDir, runLabel = 'prime-brain', trainRatio = 0.9 } = options;

  ensureDir(outputDir);

  const runId = `${runLabel}-${DateTime.now().toFormat('yyyyLLdd-HHmmss')}`;
  const samples = buildInstructionSamples(records);
  const shuffled = shuffle(samples);
  const { train, validation } = splitSamples(shuffled, trainRatio);

  const datasetHash = hash({
    runId,
    samples,
  });

  const datasetDir = path.join(outputDir, runId);
  ensureDir(datasetDir);

  await fs.writeFile(path.join(datasetDir, 'train.jsonl'), `${toJsonlLines(train)}\n`, 'utf-8');
  await fs.writeFile(path.join(datasetDir, 'validation.jsonl'), `${toJsonlLines(validation)}\n`, 'utf-8');
  await fs.writeJson(
    path.join(datasetDir, 'metadata.json'),
    {
      runId,
      createdAt: DateTime.now().toISO(),
      hash: datasetHash,
      counts: {
        totalRecords: records.length,
        totalSamples: samples.length,
        train: train.length,
        validation: validation.length,
      },
      modeDistribution: countModes(samples),
    },
    { spaces: 2 },
  );

  const manifest: DatasetManifest = {
    runId,
    createdAt: DateTime.now().toISO(),
    hash: datasetHash,
    counts: {
      totalRecords: records.length,
      totalSamples: samples.length,
      train: train.length,
      validation: validation.length,
    },
    modeDistribution: countModes(samples),
  };

  await fs.writeJson(path.join(datasetDir, 'manifest.json'), manifest, { spaces: 2 });

  return manifest;
}


