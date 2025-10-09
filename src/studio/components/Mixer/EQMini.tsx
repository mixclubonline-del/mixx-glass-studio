/**
 * EQ Mini Component
 * Compact 3-band EQ display
 */

import { EQParams } from '@/types/audio';
import { PluginKnob } from '../PluginKnob';

interface EQMiniProps {
  params: EQParams;
  onChange: (params: Partial<EQParams>) => void;
}

export function EQMini({ params, onChange }: EQMiniProps) {
  return (
    <div className="flex gap-2 p-2 rounded glass justify-center">
      <PluginKnob
        label="Low"
        value={params.low.gain}
        min={-12}
        max={12}
        step={0.1}
        onChange={(gain) => onChange({ low: { ...params.low, gain } })}
        unit="dB"
        color="blue"
      />
      <PluginKnob
        label="Mid"
        value={params.mid.gain}
        min={-12}
        max={12}
        step={0.1}
        onChange={(gain) => onChange({ mid: { ...params.mid, gain } })}
        unit="dB"
        color="prime"
      />
      <PluginKnob
        label="High"
        value={params.high.gain}
        min={-12}
        max={12}
        step={0.1}
        onChange={(gain) => onChange({ high: { ...params.high, gain } })}
        unit="dB"
        color="pink"
      />
    </div>
  );
}
