
import React, { useState, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { PrimeLensSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const SegmentedControl: React.FC<{ label: string, options: string[], value: string, onChange: (val: string) => void }> = ({ label, options, value, onChange }) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-wider uppercase text-white/60">{label}</span>
        <div className="flex bg-white/10 rounded-lg p-1">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200
                        ${value === option ? 'bg-cyan-600/40 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'text-white/50 hover:bg-white/20 hover:text-white'}
                    `}
                >
                    {option.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

const LensVisualizer: React.FC<{ gain: number, resolution: number, colorMode: PrimeLensSettings['colorMode'] }> = ({ gain, resolution, colorMode }) => {
    const numBars = 8 + Math.round(resolution / 100 * 120);
    const [bars, setBars] = useState<number[]>(Array(numBars).fill(0));

    useEffect(() => {
        const interval = setInterval(() => {
            setBars(b => b.map(v => Math.max(0, v * 0.7 + Math.random() * (gain / 100))));
        }, 100);
        return () => clearInterval(interval);
    }, [gain, numBars]);
    
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-64 h-64 relative animate-[spin_20s_linear_infinite]">
                 {bars.map((height, i) => {
                    let color;
                    switch (colorMode) {
                        case 'mood': color = `hsl(270, 80%, ${50 + height * 30}%)`; break;
                        case 'thermal': color = `hsl(${240 - height * 240}, 90%, 60%)`; break;
                        case 'spectral': default: color = `hsl(${(i / numBars) * 360}, 90%, 60%)`; break;
                    }
                     return (
                         <div key={i} className="absolute bottom-1/2 left-1/2 w-1 rounded-t-full origin-bottom transition-all duration-100" style={{
                            height: `${height * 50}%`,
                            backgroundColor: color,
                            transform: `rotate(${(i/numBars)*360}deg)`
                         }} />
                     );
                 })}
            </div>
        </div>
    );
};

export const PrimeLens: React.FC<PluginComponentProps<PrimeLensSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { gain, resolution, colorMode, mix, output } = pluginState;

    // Register plugin with Flow
    const { broadcast } = useFlowComponent({
        id: `plugin-prime-lens-${name}`,
        type: 'plugin',
        name: `Prime Lens: ${name}`,
        broadcasts: ['parameter_change', 'state_change'],
        listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
    });

    const handleValueChange = (param: keyof PrimeLensSettings, value: number | string) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'prime-lens', parameter: param, value });
        broadcast('parameter_change', { plugin: 'prime-lens', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 bg-black/20 border border-cyan-400/20 rounded-lg overflow-hidden">
                    <LensVisualizer gain={gain} resolution={resolution} colorMode={colorMode} />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Knob label="Gain" value={gain} setValue={(v) => handleValueChange('gain', v)} paramName="gain" isLearning={isLearning('gain')} onMidiLearn={onMidiLearn} />
                    <Knob label="Resolution" value={resolution} setValue={(v) => handleValueChange('resolution', v)} paramName="resolution" isLearning={isLearning('resolution')} onMidiLearn={onMidiLearn} />
                    <SegmentedControl label="Color Mode" options={['spectral', 'mood', 'thermal']} value={colorMode} onChange={(v) => handleValueChange('colorMode', v)} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};