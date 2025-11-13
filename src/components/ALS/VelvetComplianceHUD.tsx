import React, { useMemo } from 'react';
import type { VelvetLoudnessMetrics } from '../../audio/VelvetLoudnessMeter';
import type { MasteringProfile } from '../../types/sonic-architecture';
import { hexToRgba } from '../../utils/ALS';

interface VelvetComplianceHUDProps {
  metrics: VelvetLoudnessMetrics;
  profile: MasteringProfile;
  className?: string;
}

type StatusState = 'ready' | 'soft' | 'hot' | 'settling';

interface StatusDescriptor {
  label: string;
  description: string;
  tone: StatusState;
}

const STATUS_COLORS: Record<StatusState, { base: string; glow: string }> = {
  ready: { base: '#c4b5fd', glow: '#8b5cf6' },
  soft: { base: '#38bdf8', glow: '#0ea5e9' },
  hot: { base: '#fb7185', glow: '#f43f5e' },
  settling: { base: '#facc15', glow: '#f59e0b' },
};

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

const VelvetComplianceHUD: React.FC<VelvetComplianceHUDProps> = ({
  metrics,
  profile,
  className,
}) => {
  const ceiling = profile.truePeakCeiling;

  const sections = useMemo(() => {
    const loudness = evaluateLoudness(metrics.integratedLUFS, profile.targetLUFS, ceiling);
    const dynamics = evaluateDynamics(metrics.momentaryLUFS, metrics.shortTermLUFS);
    const crest = evaluateTruePeak(metrics.truePeakDb, ceiling);
    return [
      { key: 'loudness', title: 'Energy', descriptor: loudness },
      { key: 'dynamics', title: 'Dynamics', descriptor: dynamics },
      { key: 'crest', title: 'Headroom', descriptor: crest },
    ];
  }, [metrics.integratedLUFS, metrics.momentaryLUFS, metrics.shortTermLUFS, metrics.truePeakDb, profile.targetLUFS, ceiling]);

  return (
    <div
      className={`pointer-events-none fixed bottom-40 right-12 z-30 flex flex-col gap-3 ${className ?? ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[0.62rem] uppercase tracking-[0.4em] text-ink/70">
          Velvet Compliance
        </span>
        <span className="px-3 py-1 rounded-full bg-[rgba(68,37,130,0.35)] border border-[rgba(147,112,219,0.6)] text-[0.55rem] uppercase tracking-[0.3em] text-violet-100">
          {profile.name}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sections.map(({ key, title, descriptor }) => {
          const palette = STATUS_COLORS[descriptor.tone];
          return (
            <div
              key={key}
              className="rounded-2xl border border-white/8 bg-[rgba(10,17,32,0.88)] backdrop-blur-xl px-4 py-4 shadow-[0_22px_48px_rgba(4,12,26,0.45)] pointer-events-auto"
              style={{
                boxShadow: `0 0 18px ${hexToRgba(palette.glow, 0.35)}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.55rem] uppercase tracking-[0.35em] text-ink/70">
                  {title}
                </span>
                <span
                  className="px-2 py-1 rounded-full text-[0.55rem] uppercase tracking-[0.3em]"
                  style={{
                    background: hexToRgba(palette.base, 0.18),
                    color: hexToRgba(palette.glow, 0.9),
                    border: `1px solid ${hexToRgba(palette.glow, 0.4)}`,
                  }}
                >
                  {descriptor.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink/70">
                {descriptor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VelvetComplianceHUD;

