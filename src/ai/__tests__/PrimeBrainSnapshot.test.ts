import { describe, it, expect } from 'vitest';
import {
  buildPrimeBrainRawSnapshot,
  PrimeBrainSnapshotInputs,
} from '../PrimeBrainSnapshot';

describe('PrimeBrainSnapshot', () => {
  const baseInputs: PrimeBrainSnapshotInputs = {
    sessionId: 'session-test',
    userId: null,
    captureTimestamp: '2025-11-12T12:00:00.000Z',
    transport: {
      isPlaying: true,
      playheadSeconds: 32.5,
      tempo: 92,
      isLooping: false,
      cycle: null,
    },
    alsChannels: [
      { channel: 'temperature', value: 0.6 },
      { channel: 'momentum', value: 0.4 },
      { channel: 'pressure', value: 0.3 },
      { channel: 'harmony', value: 0.5 },
    ],
    audioMetrics: {
      latencyMs: 8.5,
      cpuLoad: 0.42,
      dropoutsPerMinute: 0,
      bufferSize: 256,
    },
    harmonicState: {
      key: 'Eb',
      scale: 'minor',
      consonance: 0.62,
      tension: 0.48,
      velocityEnergy: 0.35,
    },
    aiAnalysisFlags: [],
    bloomTrace: [],
    userMemory: {
      recentActions: [],
      recallAnchors: [],
    },
    issuedCommands: [],
    conversationTurns: [],
    modeHints: {
      isPlaying: true,
      armedTrackCount: 0,
      activeBloomActions: 0,
      cpuLoad: 0.42,
      dropoutsPerMinute: 0,
    },
    guidance: undefined,
  };

  it('builds a raw snapshot with normalized ALS channels', () => {
    const snapshot = buildPrimeBrainRawSnapshot(baseInputs);
    expect(snapshot.snapshotId).toBeTruthy();
    expect(snapshot.mode).toBe('active');
    expect(snapshot.alsChannels).toHaveLength(4);
    snapshot.alsChannels.forEach((channel) => {
      expect(channel.value).toBeGreaterThanOrEqual(0);
      expect(channel.value).toBeLessThanOrEqual(1);
      expect(channel.normalized).toBeGreaterThanOrEqual(0);
      expect(channel.normalized).toBeLessThanOrEqual(1);
    });
  });

  it('escalates to optimizing mode when hints indicate critical load', () => {
    const snapshot = buildPrimeBrainRawSnapshot({
      ...baseInputs,
      modeHints: {
        ...baseInputs.modeHints,
        cpuLoad: 0.95,
      },
      aiAnalysisFlags: [
        { category: 'engine-cpu', severity: 'critical', message: 'engine load high' },
      ],
    });
    expect(snapshot.mode).toBe('optimizing');
  });

  it('switches to learning mode when armed tracks exist', () => {
    const snapshot = buildPrimeBrainRawSnapshot({
      ...baseInputs,
      modeHints: {
        ...baseInputs.modeHints,
        armedTrackCount: 2,
        isPlaying: false,
      },
    });
    expect(snapshot.mode).toBe('learning');
  });
});

