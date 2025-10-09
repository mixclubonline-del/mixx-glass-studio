import { PluginKnob } from './PluginKnob';

interface EffectsRackProps {
  reverbMix: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  limiterThreshold: number;
  onEffectChange: (param: string, value: number) => void;
}

export function EffectsRack({
  reverbMix,
  delayTime,
  delayFeedback,
  delayMix,
  limiterThreshold,
  onEffectChange
}: EffectsRackProps) {
  return (
    <div className="glass-glow rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold neon-text">Mix Bus Effects</h3>

      {/* MixxVerb */}
      <div className="glass rounded-lg p-4">
        <h4 className="text-sm font-semibold text-[hsl(var(--prime-500))] mb-4">
          MixxVerb
        </h4>
        <div className="flex justify-around">
          <PluginKnob
            label="Mix"
            value={reverbMix}
            min={0}
            max={1}
            onChange={(v) => onEffectChange('reverbMix', v)}
            color="prime"
          />
        </div>
      </div>

      {/* MixxDelay */}
      <div className="glass rounded-lg p-4">
        <h4 className="text-sm font-semibold text-[hsl(var(--neon-blue))] mb-4">
          MixxDelay
        </h4>
        <div className="flex justify-around">
          <PluginKnob
            label="Time"
            value={delayTime}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(v) => onEffectChange('delayTime', v)}
            unit="s"
            color="blue"
          />
          <PluginKnob
            label="Feedback"
            value={delayFeedback}
            min={0}
            max={0.9}
            onChange={(v) => onEffectChange('delayFeedback', v)}
            color="blue"
          />
          <PluginKnob
            label="Mix"
            value={delayMix}
            min={0}
            max={1}
            onChange={(v) => onEffectChange('delayMix', v)}
            color="blue"
          />
        </div>
      </div>

      {/* Limiter */}
      <div className="glass rounded-lg p-4">
        <h4 className="text-sm font-semibold text-[hsl(var(--neon-pink))] mb-4">
          Master Limiter
        </h4>
        <div className="flex justify-around">
          <PluginKnob
            label="Threshold"
            value={limiterThreshold}
            min={-20}
            max={0}
            step={0.1}
            onChange={(v) => onEffectChange('limiterThreshold', v)}
            unit="dB"
            color="pink"
          />
        </div>
      </div>
    </div>
  );
}