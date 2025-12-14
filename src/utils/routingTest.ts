/**
 * Routing Verification Test Utility
 * 
 * Tests that tracks route to correct buses based on their role and ID.
 * This verifies the SignalMatrix routing logic matches expected behavior.
 */

import { createSignalMatrix } from '../audio/SignalMatrix';

/**
 * Test case: Track ID and role mapping to expected bus
 */
interface RoutingTestCase {
  trackId: string;
  role?: string;
  expectedBus: 'twoTrack' | 'vocals' | 'drums' | 'bass' | 'music' | 'stemMix';
  description: string;
}

/**
 * Test cases covering all routing scenarios
 */
const ROUTING_TEST_CASES: RoutingTestCase[] = [
  // Two Track routing
  {
    trackId: 'track-two-track',
    role: undefined,
    expectedBus: 'twoTrack',
    description: 'Two Track by ID',
  },
  {
    trackId: 'track-123',
    role: 'two-track',
    expectedBus: 'twoTrack',
    description: 'Two Track by role',
  },
  {
    trackId: 'track-456',
    role: 'twotrack',
    expectedBus: 'twoTrack',
    description: 'Two Track by role (variant)',
  },
  
  // Vocals routing
  {
    trackId: 'track-stem-vocals',
    role: undefined,
    expectedBus: 'vocals',
    description: 'Vocals stem by ID',
  },
  {
    trackId: 'track-789',
    role: 'vocal',
    expectedBus: 'vocals',
    description: 'Vocals by role',
  },
  {
    trackId: 'track-hush-record',
    role: undefined,
    expectedBus: 'vocals',
    description: 'Hush Record (routes to vocals bus)',
  },
  
  // Drums routing
  {
    trackId: 'track-stem-drums',
    role: undefined,
    expectedBus: 'drums',
    description: 'Drums stem by ID',
  },
  {
    trackId: 'track-abc',
    role: 'drum',
    expectedBus: 'drums',
    description: 'Drums by role',
  },
  
  // Bass routing
  {
    trackId: 'track-stem-bass',
    role: undefined,
    expectedBus: 'bass',
    description: 'Bass stem by ID',
  },
  {
    trackId: 'track-def',
    role: 'bass',
    expectedBus: 'bass',
    description: 'Bass by role',
  },
  
  // Music bus routing (harmonic, perc, sub)
  {
    trackId: 'track-stem-harmonic',
    role: undefined,
    expectedBus: 'music',
    description: 'Harmonic stem by ID',
  },
  {
    trackId: 'track-stem-perc',
    role: undefined,
    expectedBus: 'music',
    description: 'Perc stem by ID',
  },
  {
    trackId: 'track-stem-sub',
    role: undefined,
    expectedBus: 'music',
    description: 'Sub stem by ID',
  },
  {
    trackId: 'track-ghi',
    role: 'harmonic',
    expectedBus: 'music',
    description: 'Harmonic by role',
  },
  {
    trackId: 'track-jkl',
    role: 'perc',
    expectedBus: 'music',
    description: 'Perc by role',
  },
  {
    trackId: 'track-mno',
    role: 'sub',
    expectedBus: 'music',
    description: 'Sub by role',
  },
  
  // Fallback to stemMix
  {
    trackId: 'track-unknown',
    role: 'standard',
    expectedBus: 'stemMix',
    description: 'Unknown track falls back to stemMix',
  },
  {
    trackId: 'track-random-123',
    role: undefined,
    expectedBus: 'stemMix',
    description: 'Track with no role falls back to stemMix',
  },
];

/**
 * Get bus name from GainNode by comparing references
 */
function getBusName(
  busNode: GainNode,
  buses: ReturnType<typeof createSignalMatrix>['buses']
): string {
  const entry = Object.entries(buses).find(([_, node]) => node === busNode);
  return entry ? entry[0] : 'unknown';
}

/**
 * Run routing verification tests
 * 
 * @param audioContext - AudioContext for creating test SignalMatrix
 * @returns Test results with pass/fail status
 */
export function testRoutingVerification(audioContext: AudioContext): {
  passed: number;
  failed: number;
  results: Array<{
    testCase: RoutingTestCase;
    passed: boolean;
    actualBus: string;
    error?: string;
  }>;
} {
  // Create a dummy master input for testing
  const dummyMasterInput = audioContext.createGain();
  const signalMatrix = createSignalMatrix(audioContext, dummyMasterInput);
  
  const results: Array<{
    testCase: RoutingTestCase;
    passed: boolean;
    actualBus: string;
    error?: string;
  }> = [];
  
  let passed = 0;
  let failed = 0;
  
  ROUTING_TEST_CASES.forEach((testCase) => {
    try {
      const routedBus = signalMatrix.routeTrack(testCase.trackId, testCase.role);
      const actualBusName = getBusName(routedBus, signalMatrix.buses);
      const passedTest = actualBusName === testCase.expectedBus;
      
      if (passedTest) {
        passed++;
      } else {
        failed++;
      }
      
      results.push({
        testCase,
        passed: passedTest,
        actualBus: actualBusName,
        error: passedTest ? undefined : `Expected ${testCase.expectedBus}, got ${actualBusName}`,
      });
    } catch (error) {
      failed++;
      results.push({
        testCase,
        passed: false,
        actualBus: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
  
  return { passed, failed, results };
}

/**
 * Log routing test results to console
 */
export function logRoutingTestResults(
  results: ReturnType<typeof testRoutingVerification>
): void {
  console.group('[ROUTING TEST] Verification Results');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.group('❌ Failed Tests');
    results.results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.error(
          `  ${result.testCase.description}:`,
          result.error || `Expected ${result.testCase.expectedBus}, got ${result.actualBus}`
        );
      });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Verify bus connectivity chain
 * 
 * Checks that buses are correctly connected:
 * - All stem buses → stemMix
 * - stemMix → masterTap
 * - masterTap → masterInput
 */
export function verifyBusConnectivity(
  signalMatrix: ReturnType<typeof createSignalMatrix>
): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check that stem buses connect to stemMix
  const stemBuses: Array<keyof typeof signalMatrix.buses> = [
    'twoTrack',
    'vocals',
    'drums',
    'bass',
    'music',
  ];
  
  // Note: We can't directly inspect Web Audio API connections in a pure test,
  // but we can verify the structure is correct by checking the buses exist
  stemBuses.forEach((busName) => {
    if (!signalMatrix.buses[busName]) {
      issues.push(`Missing bus: ${busName}`);
    }
  });
  
  if (!signalMatrix.buses.stemMix) {
    issues.push('Missing stemMix bus');
  }
  
  if (!signalMatrix.buses.masterTap) {
    issues.push('Missing masterTap bus');
  }
  
  if (!signalMatrix.buses.air) {
    issues.push('Missing air bus');
  }
  
  // Verify gain staging values are set
  if (signalMatrix.buses.twoTrack.gain.value !== 0.65) {
    issues.push(`twoTrack gain should be 0.65, got ${signalMatrix.buses.twoTrack.gain.value}`);
  }
  
  if (signalMatrix.buses.vocals.gain.value !== 1.15) {
    issues.push(`vocals gain should be 1.15, got ${signalMatrix.buses.vocals.gain.value}`);
  }
  
  if (signalMatrix.buses.drums.gain.value !== 1.0) {
    issues.push(`drums gain should be 1.0, got ${signalMatrix.buses.drums.gain.value}`);
  }
  
  if (signalMatrix.buses.bass.gain.value !== 0.85) {
    issues.push(`bass gain should be 0.85, got ${signalMatrix.buses.bass.gain.value}`);
  }
  
  if (signalMatrix.buses.music.gain.value !== 0.9) {
    issues.push(`music gain should be 0.9, got ${signalMatrix.buses.music.gain.value}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Run all routing tests and log results
 * 
 * Call this from browser console or test environment:
 * ```ts
 * import { runRoutingTests } from './utils/routingTest';
 * runRoutingTests();
 * ```
 */
export function runRoutingTests(): void {
  if (typeof window === 'undefined' || !window.AudioContext) {
    console.error('[ROUTING TEST] AudioContext not available');
    return;
  }
  
  const ctx = new AudioContext();
  const results = testRoutingVerification(ctx);
  logRoutingTestResults(results);
  
  const dummyMasterInput = ctx.createGain();
  const signalMatrix = createSignalMatrix(ctx, dummyMasterInput);
  const connectivity = verifyBusConnectivity(signalMatrix);
  
  console.group('[ROUTING TEST] Bus Connectivity');
  if (connectivity.valid) {
    console.log('✅ All buses properly configured');
  } else {
    console.error('❌ Connectivity issues:');
    connectivity.issues.forEach((issue) => console.error(`  - ${issue}`));
  }
  console.groupEnd();
  
  ctx.close();
}
