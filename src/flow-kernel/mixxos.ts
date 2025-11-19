/**
 * MixxOS Kernel – Soft Prime Boot
 *
 * This is the "Prime-only" dev boot profile:
 * - Full diagnostics & metrics are available for Prime
 * - Soft boot avoids hard fails; audio can still come up even if some services lag
 * - All knobs live here so we can flip other modes later (Hard, Quantum, etc.)
 */

export type PrimeBootMode = 'soft-prime';

export interface PrimeBootConfig {
  mode: PrimeBootMode;
  /**
   * If true, skips the Web Audio warmup sequence.
   * In Soft Prime Boot we want the *real* audio path,
   * so this stays false by default.
   */
  skipAudioWarmup: boolean;

  /**
   * Controls whether deep audio diagnostics are actually invoked.
   * When false, calls are no-op but the wiring stays intact.
   */
  enableAudioDiagnostics: boolean;

  /**
   * Controls mixer audits (routing, gain structure, etc.).
   */
  enableMixerAudit: boolean;

  /**
   * Optional metadata for overlays / future MixxOS UI.
   */
  label: string;
  description: string;
}

/**
 * Factory for the Soft Prime Boot profile.
 * Later we can swap this out for other modes without rewiring FlowRuntime.
 */
export function createSoftPrimeBootConfig(): PrimeBootConfig {
  return {
    mode: 'soft-prime',
    // In Prime dev we want the full signal path exercised.
    skipAudioWarmup: false,
    // Keep diagnostics & audits ON in Soft Prime Boot:
    // they're for you, not for end users.
    enableAudioDiagnostics: true,
    enableMixerAudit: true,
    label: 'Soft Prime Boot',
    description:
      'Prime-only development boot: full diagnostics and metrics available, with a forgiving startup profile.',
  };
}

