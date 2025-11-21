

import React, { useState, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxGlueSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const SidechainButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void, isConnected: boolean; sourceTrackName?: string }> = ({ label, value, onChange, isConnected, sourceTrackName }) => (
    <button
        onClick={() => onChange(!value)}
        disabled={!isConnected}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
            ${value ? 'bg-cyan-600/40 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]' 
                   : (isConnected ? 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white' : 'bg-white/10 text-white/50')}
        `}
    >
        {label}
    </button>
);

const CompressionVisualizer: React.FC<{ threshold: number, ratio: number, release: number, mix: number, sidechainActive: boolean }> = ({ threshold, ratio, release, mix, sidechainActive }) => {
    const [gainReduction, setGainReduction] = useState(0);
    const [inputLevel, setInputLevel] = useState(0);
    const meterHeight = 160;

    useEffect(() => {
        let animationFrameId: number;
        const animate = () => {
            // Simulate a punchy, dynamic input signal
            // If sidechain is active, simulate a stronger, more rhythmic signal
            const peak = (sidechainActive && Math.random() > 0.8) || (!sidechainActive && Math.random() > 0.95) ? 1 : Math.pow(Math.random(), 3);
            const level = peak * 60; // 0 to 60 (representing -60dB to 0dB)
            setInputLevel(prev => level > prev ? level : prev * 0.9);

            let currentGR = 0;
            const thresholdLevel = (60 + threshold);
            if (level > thresholdLevel) {
                currentGR = (level - thresholdLevel) * (1 - 1 / ratio);
            }
            
            // Apply release timing
            const decayRate = 1 - Math.exp(-1000 / (release * 20)); // Make release more visually responsive
            setGainReduction(prev => Math.max(0, currentGR > prev ? currentGR : prev - decayRate * 0.5));

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [threshold, ratio, release, sidechainActive]);

    const thresholdPosition = (60 + threshold) / 60 * meterHeight;
    const inputPosition = inputLevel / 60 * meterHeight;
    const grAmount = Math.min(gainReduction, 30) / 30; // Normalize GR up to 30dB for visual effect

    const coreSquashX = 1 + grAmount * 0.3; // Get wider
    const coreSquashY = 1 - grAmount * 0.5; // Get shorter
    const coreTransform = `scale(${coreSquashX}, ${coreSquashY})`;
    const coreColor = sidechainActive ? 'hsla(180, 90%, 60%,' : 'hsla(270, 90%, 60%,';
    const grFillOpacity = grAmount * (mix / 100);

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* VU Meter */}
            <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 w-4 h-48 bg-black/30 rounded-full overflow-hidden border border-white/10">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-violet-500 to-pink-500 rounded-full transition-all duration-100" style={{height: `${inputPosition}px`}}/>
                <div className="absolute left-full w-2 h-px bg-cyan-300" style={{bottom: `${thresholdPosition}px`}} />
            </div>

            {/* Central Core */}
            <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 transition-transform duration-100" style={{
                transform: coreTransform,
                animation: grAmount > 0 ? 'none' : 'glue-wobble 4s infinite ease-in-out'
            }}>
                <div className="w-full h-full rounded-full" style={{
                    background: `radial-gradient(circle, transparent 0%, ${coreColor} ${grFillOpacity}) 100%)`,
                    boxShadow: `0 0 ${grAmount * 40}px ${coreColor} ${grFillOpacity * 2})`,
                }}/>
            </div>
            <span className="font-orbitron text-xl font-bold text-violet-300/80 z-10">{gainReduction.toFixed(1)} dB</span>
        </div>
    );
};

export const MixxGlue: React.FC<PluginComponentProps<MixxGlueSettings>> = ({ 
  isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn, isSidechainTarget
}) => {
    const { threshold, ratio, release, sidechainActive, mix, output } = pluginState; 

    // Register plugin with Flow
    const { broadcast } = useFlowComponent({
        id: `plugin-mixx-glue-${name}`,
        type: 'plugin',
        name: `Mixx Glue: ${name}`,
        broadcasts: ['parameter_change', 'state_change'],
        listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
    });

    const handleValueChange = (param: keyof MixxGlueSettings, value: number | boolean) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-glue', parameter: param, value });
        broadcast('parameter_change', { plugin: 'mixx-glue', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-wrap items-center justify-around gap-4 p-4">
                <CompressionVisualizer threshold={threshold} ratio={ratio} release={release} mix={mix} sidechainActive={sidechainActive} />
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Threshold" value={threshold} setValue={(v) => handleValueChange('threshold', v)} min={-60} max={0} paramName="threshold" isLearning={isLearning('threshold')} onMidiLearn={onMidiLearn} />
                    <Knob label="Ratio" value={ratio} setValue={(v) => handleValueChange('ratio', v)} min={1} max={20} step={0.5} paramName="ratio" isLearning={isLearning('ratio')} onMidiLearn={onMidiLearn} />
                    <Knob label="Release" value={release} setValue={(v) => handleValueChange('release', v)} min={10} max={2000} step={10} paramName="release" isLearning={isLearning('release')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                    <div className="w-28 flex flex-col justify-center items-center gap-1">
                      <SidechainButton 
                        label="SIDECHAIN" 
                        value={sidechainActive} 
                        onChange={(v) => handleValueChange('sidechainActive', v)} 
                        isConnected={isSidechainTarget ?? false}
                        sourceTrackName={isSidechainTarget ? "Connected" : undefined}
                      />
                      {isSidechainTarget && (
                        <span className="text-[10px] text-cyan-300/70 uppercase tracking-wider">
                          {"Connected"}
                        </span>
                      )}
                    </div>
                </div>
            </div>
        </PluginContainer>
    );
};