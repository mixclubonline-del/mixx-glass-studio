import React from 'react';
import type { VelvetLoudnessMetrics } from '../../audio/VelvetLoudnessMeter';
import type { MasteringProfile } from '../../types/sonic-architecture';

interface VelvetComplianceHUDProps {
  metrics: VelvetLoudnessMetrics;
  profile: MasteringProfile;
  className?: string;
}

type StatusState = 'ready' | 'soft' | 'hot' | 'settling';

export interface StatusDescriptor {
  label: string;
  description: string;
  tone: StatusState;
}

const VELVET_TARGET_BAND = 1;

function evaluateLoudness(
  value: number,
  target: number,
  ceiling: number
): StatusDescriptor {
  if (!Number.isFinite(value)) {
    return {
      label: 'Listening',
      description: 'Dialing in Velvet reference.',
      tone: 'settling',
    };
  }

  const delta = value - target;
  if (delta > 1.5) {
    return {
      label: 'Too Intense',
      description: 'Ease master trim or bus glue to breathe.',
      tone: 'hot',
    };
  }
  if (delta < -VELVET_TARGET_BAND) {
    return {
      label: 'Too Soft',
      description: 'Lift master energy or revisit Velvet Floor depth.',
      tone: 'soft',
    };
  }
  if (ceiling - value < 6) {
    return {
      label: 'Rising',
      description: 'Headroom tightening—check low anchors.',
      tone: 'hot',
    };
  }
  return {
    label: 'On Signature',
    description: 'Velvet gain staging locked for this profile.',
    tone: 'ready',
  };
}

function evaluateTruePeak(value: number, ceiling: number): StatusDescriptor {
  if (!Number.isFinite(value)) {
    return {
      label: 'Measuring',
      description: 'Awaiting crest capture.',
      tone: 'settling',
    };
  }
  const delta = value - ceiling;
  if (delta >= 0.2) {
    return {
      label: 'Over Crest',
      description: 'Pull limiter ceiling or mid/side side shelf.',
      tone: 'hot',
    };
  }
  if (delta < -1.2) {
    return {
      label: 'Generous Headroom',
      description: 'Safe margin. Translate to Translation Matrix.',
      tone: 'soft',
    };
  }
  return {
    label: 'Crest Safe',
    description: 'True peak containment is on target.',
    tone: 'ready',
  };
}

function evaluateDynamics(momentary: number, shortTerm: number): StatusDescriptor {
  if (!Number.isFinite(momentary) || !Number.isFinite(shortTerm)) {
    return {
      label: 'Settling',
      description: 'Listening for movement.',
      tone: 'settling',
    };
  }
  const density = shortTerm - momentary;
  if (density > 3) {
    return {
      label: 'Flat',
      description: 'Open multi-band dynamics or revisit Texture.',
      tone: 'hot',
    };
  }
  if (density < 0.5) {
    return {
      label: 'Flickering',
      description: 'Glue or Phase Weave may need cohesion.',
      tone: 'soft',
    };
  }
  return {
    label: 'Breathing',
    description: 'Energy is moving with Mixx Doctrine.',
    tone: 'ready',
  };
}

export interface ComplianceStatus {
  loudness: StatusDescriptor;
  dynamics: StatusDescriptor;
  crest: StatusDescriptor;
}

export function deriveComplianceStatus(
  metrics: VelvetLoudnessMetrics,
  profile: MasteringProfile
): ComplianceStatus {
  const ceiling = profile.truePeakCeiling;
  return {
    loudness: evaluateLoudness(metrics.integratedLUFS, profile.targetLUFS, ceiling),
    dynamics: evaluateDynamics(metrics.momentaryLUFS, metrics.shortTermLUFS),
    crest: evaluateTruePeak(metrics.truePeakDb, ceiling),
  };
}

const VelvetComplianceHUD: React.FC<VelvetComplianceHUDProps> = () => null;

export default VelvetComplianceHUD;

