

import React, { useState, useEffect, useRef } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxLimiterSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const ToggleButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void, isSidechainButton?: boolean, isSidechainConnected?: boolean }> = ({ label, value, onChange, isSidechainButton=false, isSidechainConnected=false }) => {
    const activeColor = isSidechainButton ? 'bg-cyan-600/40 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'bg-yellow-400/40 text-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.4)]';
    const inactiveConnectedColor = 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white';
    const inactiveColor = 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white';
    
    return (
        <button
            onClick={() => onChange(!value)}
            disabled={isSidechainButton && !isSidechainConnected}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                ${value ? activeColor : (isSidechainButton && isSidechainConnected ? inactiveConnectedColor : inactiveColor)}
            `}
        >
            {label}
        </button>
    );
}

const LimiterVisualizer: React.FC<{ ceiling: number, drive: number, sidechainActive: boolean }> = ({ ceiling, drive, sidechainActive }) => {
    const [level, setLevel] = useState(0);
    const [gainReduction, setGainReduction] = useState(0);
    const [peakHoldLevel, setPeakHoldLevel] = useState(-24);
    const [isClipping, setIsClipping] = useState(false);
    const peakHoldTimeoutRef = useRef<number | null>(null);
    const clipTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const sidechainFactor = sidechainActive ? 1.5 : 1;
            const inputDb = Math.pow(Math.random(), 2) * 24 - 24 + drive * sidechainFactor; // -24dB to 0dB + drive
            setLevel(inputDb);

            if (inputDb > peakHoldLevel) {
                setPeakHoldLevel(inputDb);
                if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
                peakHoldTimeoutRef.current = window.setTimeout(() => setPeakHoldLevel(p => p * 0.9), 1000);
            } else {
                setPeakHoldLevel(p => p * 0.98); // Slow decay if not re-triggered
            }

            if (inputDb > ceiling) {
                setIsClipping(true);
                if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
                clipTimeoutRef.current = window.setTimeout(() => setIsClipping(false), 50);
            }
            
            const gr = Math.max(0, inputDb - ceiling);
            setGainReduction(prev => gr > prev ? gr : prev * 0.8);
        }, 50);
        
        return () => {
            clearInterval(interval);
            if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
            if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
        };
    }, [drive, ceiling, sidechainActive, peakHoldLevel]);
    
    const levelPercent = Math.max(0, (level + 24) / 30 * 100); // Map -24 to 6dB range
    const ceilingPercent = Math.max(0, (ceiling + 24) / 30 * 100);
    const peakHoldPercent = Math.max(0, (peakHoldLevel + 24) / 30 * 100);
    const grPercent = Math.min(gainReduction / 12, 1) * 100; // Up to 12dB GR

    return (
        <div className="w-full h-full flex items-center justify-center gap-8">
            {/* Input/Output Meter */}
            <div className="w-16 h-64 bg-black/30 rounded-lg border border-white/10 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-500 to-amber-300 rounded-lg transition-all duration-75" style={{ height: `${Math.min(levelPercent, ceilingPercent)}%` }} />
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 to-orange-400 rounded-lg transition-all duration-75" style={{ height: `${levelPercent}%`, clipPath: `inset(${100 - ceilingPercent}% 0 0 0)` }} />
                <div className="absolute w-full h-0.5 bg-white" style={{ bottom: `${ceilingPercent}%` }} />
                <div className="absolute w-full h-0.5 bg-yellow-200" style={{ bottom: `${peakHoldPercent}%`, transition: 'bottom 0.05s linear' }} />
                {isClipping && <div className="absolute top-0 w-full h-2 bg-red-400 shadow-[0_0_10px_red]" />}
            </div>
            {/* GR Meter */}
            <div className="w-16 h-64 bg-black/30 rounded-lg border border-white/10 relative">
                 <div className="absolute top-0 w-full bg-gradient-to-b from-red-600 to-orange-400 rounded-lg transition-all duration-100" style={{ height: `${grPercent}%` }} />
                 <span className="absolute top-[-20px] left-1/2 -translate-x-1/2 text-white/80 font-mono">{gainReduction.toFixed(1)}dB</span>
                 <span className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-white/50 font-bold text-sm">GR</span>
            </div>
        </div>
    );
};

export const MixxLimiter: React.FC<PluginComponentProps<MixxLimiterSettings>> = ({
  isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn, isSidechainTarget
}) => {
  const { ceiling, drive, lookahead, clubCheck, sidechainActive, mix, output } = pluginState;

  // Register plugin with Flow
  const { broadcast } = useFlowComponent({
    id: `plugin-mixx-limiter-${name}`,
    type: 'plugin',
    name: `Mixx Limiter: ${name}`,
    broadcasts: ['parameter_change', 'state_change'],
    listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
  });

  const handleValueChange = (param: keyof MixxLimiterSettings, value: number | boolean) => {
    setPluginState({ [param]: value });
    PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-limiter', parameter: param, value });
    broadcast('parameter_change', { plugin: 'mixx-limiter', parameter: param, value });
  };

  return (
    <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
      <div className="w-full h-full flex items-center justify-around gap-6 p-4">
        <LimiterVisualizer ceiling={ceiling} drive={drive} sidechainActive={sidechainActive} />
        <div className="flex flex-col flex-wrap justify-center gap-4">
          <Knob label="Ceiling" value={ceiling} setValue={(v) => handleValueChange('ceiling', v)} min={-2} max={0} step={0.1} paramName="ceiling" isLearning={isLearning('ceiling')} onMidiLearn={onMidiLearn} />
          <Knob label="Drive" value={drive} setValue={(v) => handleValueChange('drive', v)} min={0} max={24} step={0.1} paramName="drive" isLearning={isLearning('drive')} onMidiLearn={onMidiLearn} />
          <Knob label="Lookahead" value={lookahead} setValue={(v) => handleValueChange('lookahead', v)} min={0} max={10} step={0.1} paramName="lookahead" isLearning={isLearning('lookahead')} onMidiLearn={onMidiLearn} />
          <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
          <div className="flex flex-col items-center justify-center gap-2 mt-4">
            <ToggleButton label="Club Check" value={clubCheck} onChange={(v) => handleValueChange('clubCheck', v)} />
            <ToggleButton 
                label="SIDECHAIN" 
                value={sidechainActive} 
                onChange={(v) => handleValueChange('sidechainActive', v)}
                isSidechainButton={true}
                isSidechainConnected={isSidechainTarget ?? false}
             />
          </div>
        </div>
      </div>
    </PluginContainer>
  );
};