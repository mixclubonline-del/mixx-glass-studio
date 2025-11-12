import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import chalk from 'chalk';

export interface TrainPrimeBrainOptions {
  datasetDir: string;
  outputDir: string;
  baseModel?: string;
  maxSteps?: number;
  learningRate?: number;
  batchSize?: number;
  gradientAccumulation?: number;
  pythonPath?: string;
}

function resolvePython(options: TrainPrimeBrainOptions) {
  if (options.pythonPath) return options.pythonPath;
  return process.env.PRIME_FABRIC_PYTHON ?? 'python3';
}

export async function trainPrimeBrain(options: TrainPrimeBrainOptions): Promise<void> {
  const datasetDir = path.resolve(options.datasetDir);
  const outputDir = path.resolve(options.outputDir);

  if (!(await fs.pathExists(datasetDir))) {
    throw new Error(`Dataset directory not found: ${datasetDir}`);
  }

  await fs.ensureDir(outputDir);

  const pythonScript = path.resolve(path.join(path.dirname(datasetDir), '..', 'training', 'train_prime_brain.py'));
  if (!(await fs.pathExists(pythonScript))) {
    throw new Error(`Training script not found at ${pythonScript}`);
  }

  const args = [
    pythonScript,
    '--dataset_dir',
    datasetDir,
    '--output_dir',
    outputDir,
    '--base_model',
    options.baseModel ?? 'google/gemma-2b-it',
    '--max_steps',
    String(options.maxSteps ?? 300),
    '--learning_rate',
    String(options.learningRate ?? 2e-5),
    '--batch_size',
    String(options.batchSize ?? 4),
    '--gradient_accumulation',
    String(options.gradientAccumulation ?? 4),
  ];

  const python = resolvePython(options);
  console.log(chalk.cyan(`Starting training with ${python} ${args.join(' ')}`));

  await new Promise<void>((resolve, reject) => {
    const child = spawn(python, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        HF_HOME: process.env.HF_HOME ?? path.join(outputDir, '.hf'),
      },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Training completed.'));
        resolve();
      } else {
        reject(new Error(`Training script exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}


