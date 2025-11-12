import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { InstructionSample, InstructionSampleSchema } from './schema.js';

export interface EvaluationOptions {
  datasetDir: string;
  outputDir: string;
  runId?: string;
}

export interface EvaluationFinding {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
}

export interface EvaluationReport {
  runId: string;
  datasetDir: string;
  createdAt: string;
  totals: {
    samples: number;
    issues: number;
    critical: number;
  };
  findings: EvaluationFinding[];
}

async function readJsonl(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function ensureNoRawNumbers(sample: InstructionSample): EvaluationFinding | null {
  const numericPattern = /\b\d+(\.\d+)?\b/;
  if (numericPattern.test(sample.response)) {
    return {
      id: sample.id,
      severity: 'critical',
      message: 'Response includes raw numeric output, violating Reduction doctrine.',
    };
  }
  return null;
}

function ensureSurfaceAlignment(sample: InstructionSample): EvaluationFinding | null {
  const preferredChannelLine = sample.prompt.split('\n').find((line) => line.startsWith('PreferredChannel'));
  const surfaceLine = sample.response.split('\n').find((line) => line.startsWith('Surface:'));

  if (!preferredChannelLine || !surfaceLine) {
    return {
      id: sample.id,
      severity: 'warn',
      message: 'Missing PreferredChannel or Surface line for Bloom/ALS alignment.',
    };
  }

  if (preferredChannelLine.includes('Bloom') && !surfaceLine.toLowerCase().includes('bloom')) {
    return {
      id: sample.id,
      severity: 'critical',
      message: 'Surface output does not reflect Bloom channel.',
    };
  }

  if (preferredChannelLine.includes('ALS') && !surfaceLine.toLowerCase().includes('als')) {
    return {
      id: sample.id,
      severity: 'critical',
      message: 'Surface output does not reflect ALS channel.',
    };
  }
  return null;
}

function ensureModeNarrative(sample: InstructionSample): EvaluationFinding | null {
  if (sample.mode === 'passive' && sample.response.toLowerCase().includes('command')) {
    return {
      id: sample.id,
      severity: 'warn',
      message: 'Passive mode response references commands; should remain observational.',
    };
  }
  return null;
}

function runChecks(sample: InstructionSample): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];
  const rules = [ensureNoRawNumbers, ensureSurfaceAlignment, ensureModeNarrative];
  rules.forEach((rule) => {
    const finding = rule(sample);
    if (finding) findings.push(finding);
  });
  return findings;
}

export async function evaluateDataset(options: EvaluationOptions): Promise<EvaluationReport> {
  const datasetDir = path.resolve(options.datasetDir);
  const runId = options.runId ?? path.basename(datasetDir);
  const outputDir = path.resolve(options.outputDir);
  await fs.ensureDir(outputDir);

  const trainPath = path.join(datasetDir, 'train.jsonl');
  const valPath = path.join(datasetDir, 'validation.jsonl');

  const samplesRaw = [...(await readJsonl(trainPath)), ...(await readJsonl(valPath))];
  const samples = samplesRaw.map((sample) => InstructionSampleSchema.parse(sample));

  const findings = samples.flatMap((sample) => runChecks(sample));

  const report: EvaluationReport = {
    runId,
    datasetDir,
    createdAt: new Date().toISOString(),
    totals: {
      samples: samples.length,
      issues: findings.length,
      critical: findings.filter((finding) => finding.severity === 'critical').length,
    },
    findings,
  };

  const reportPath = path.join(outputDir, `${runId}-evaluation.json`);
  await fs.writeJson(reportPath, report, { spaces: 2 });

  const markdownLines = [
    `# Evaluation Report: ${runId}`,
    ``,
    `- Samples Evaluated: ${report.totals.samples}`,
    `- Total Findings: ${report.totals.issues}`,
    `- Critical Findings: ${report.totals.critical}`,
    ``,
    `## Findings`,
    ``,
    ...findings.map((finding) => `- **${finding.severity.toUpperCase()}** | ${finding.id} — ${finding.message}`),
  ];

  await fs.writeFile(path.join(outputDir, `${runId}-evaluation.md`), markdownLines.join('\n'), 'utf-8');

  console.log(chalk.green(`Evaluation complete. Report saved to ${reportPath}`));

  return report;
}


