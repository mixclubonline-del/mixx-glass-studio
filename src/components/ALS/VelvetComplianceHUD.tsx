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

// Tone to color mapping
const TONE_COLORS: Record<StatusState, { bg: string; border: string; text: string }> = {
  ready: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.5)', text: '#86efac' },
  soft: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.5)', text: '#fef08a' },
  hot: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', text: '#fca5a5' },
  settling: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
};

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

// Status indicator component
const StatusIndicator: React.FC<{ label: string; status: StatusDescriptor }> = ({ label, status }) => {
  const colors = TONE_COLORS[status.tone];
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        marginBottom: '4px',
      }}
    >
      <span style={{ fontSize: '9px', color: 'rgba(230, 240, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ fontSize: '10px', fontWeight: 600, color: colors.text, textTransform: 'uppercase' }}>
        {status.label}
      </span>
    </div>
  );
};

const VelvetComplianceHUD: React.FC<VelvetComplianceHUDProps> = ({ metrics, profile, className }) => {
  const status = deriveComplianceStatus(metrics, profile);
  
  return (
    <div 
      className={className}
      style={{
        background: 'rgba(9, 18, 36, 0.85)',
        border: '1px solid rgba(102, 140, 198, 0.4)',
        borderRadius: '8px',
        padding: '10px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(230, 240, 255, 0.6)', 
        textTransform: 'uppercase', 
        letterSpacing: '1px',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        Velvet Compliance
      </div>
      <StatusIndicator label="Energy" status={status.loudness} />
      <StatusIndicator label="Dynamics" status={status.dynamics} />
      <StatusIndicator label="Crest" status={status.crest} />
    </div>
  );
};

export default VelvetComplianceHUD;
