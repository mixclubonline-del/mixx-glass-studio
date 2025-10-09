/**
 * Compressor Mini Component
 * Compact compressor display
 */

import { CompressorParams } from '@/types/audio';
import { PluginKnob } from '../PluginKnob';

interface CompressorMiniProps {
  params: CompressorParams;
  onChange: (params: Partial<CompressorParams>) => void;
  reduction?: number;
}

export function CompressorMini({ params, onChange, reduction = 0 }: CompressorMiniProps) {
  return (
    <div className="flex flex-col gap-2 p-2 rounded glass">
      <div className="flex gap-2 justify-center">
        <PluginKnob
          label="Thresh"
          value={params.threshold}
          min={-60}
          max={0}
          step={0.5}
          onChange={(threshold) => onChange({ threshold })}
          unit="dB"
          color="blue"
        />
        <PluginKnob
          label="Ratio"
          value={params.ratio}
          min={1}
          max={20}
          step={0.1}
          onChange={(ratio) => onChange({ ratio })}
          unit=":1"
          color="prime"
        />
      </div>
      
      {/* Gain Reduction Meter */}
      {reduction < 0 && (
        <div className="flex items-center gap-1 text-[9px]">
          <span className="text-muted-foreground">GR:</span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.min(100, Math.abs(reduction) * 5)}%` }}
            />
          </div>
          <span className="text-accent font-mono">{reduction.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
