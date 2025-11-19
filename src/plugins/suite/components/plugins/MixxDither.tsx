
import React, { useMemo } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxDitherSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const SegmentedControl: React.FC<{ label: string, options: (string|number)[], value: string|number, onChange: (val: any) => void }> = ({ label, options, value, onChange }) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-wider uppercase text-white/60">{label}</span>
        <div className="flex bg-white/10 rounded-lg p-1">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200
                        ${value === option ? 'bg-amber-400/40 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-white/50 hover:bg-white/20 hover:text-white'}
                    `}
                >
                    {String(option).toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

const DitherVisualizer: React.FC<MixxDitherSettings> = ({ bitDepth, noiseShaping, ditherAmount }) => {
    const particleCount = 200;
    const normalizedAmount = ditherAmount / 100;

    const color = useMemo(() => {
        switch(noiseShaping) {
            case 'low': return 'hsla(200, 80%, 70%, 0.7)';
            case 'high': return 'hsla(280, 80%, 70%, 0.7)';
            case 'none':
            default: return 'hsla(0, 0%, 100%, 0.7)';
        }
    }, [noiseShaping]);

    const particles = useMemo(() => Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        left: `${i / (particleCount - 1) * 100}%`,
        animationDuration: `${0.1 + Math.random() * 0.2}s`,
        animationDelay: `${Math.random() * 0.3}s`,
    })), [particleCount]);

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/30 border border-amber-400/20 rounded-lg overflow-hidden">
             <div className="w-full h-1/4 absolute bottom-0">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute w-px bg-white bottom-0"
                        style={{
                            left: p.left,
                            height: `var(--height)`,
                            backgroundColor: color,
                            '--height': `${Math.random() * 100}%`,
                            transform: `scaleY(${normalizedAmount})`,
                            animation: `dither-flicker ${p.animationDuration} ${p.animationDelay} infinite alternate`,
                        } as React.CSSProperties}
                    />
                ))}
            </div>
             <style>{`
                @keyframes dither-flicker {
                    from { height: 0%; }
                    to { height: var(--height); }
                }
            `}</style>
            <div className="absolute font-orbitron text-amber-200/50 text-4xl font-bold select-none">{bitDepth}-bit</div>
        </div>
    );
};

export const MixxDither: React.FC<PluginComponentProps<MixxDitherSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { bitDepth, noiseShaping, ditherAmount, output } = pluginState;

    // Register plugin with Flow
    const { broadcast } = useFlowComponent({
        id: `plugin-mixx-dither-${name}`,
        type: 'plugin',
        name: `Mixx Dither: ${name}`,
        broadcasts: ['parameter_change', 'state_change'],
        listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
    });

    const handleValueChange = (param: keyof MixxDitherSettings, value: number | string) => {
        setPluginState({ [param]: value as any }); // Cast as any to handle union types
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-dither', parameter: param, value });
        broadcast('parameter_change', { plugin: 'mixx-dither', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1">
                    <DitherVisualizer {...pluginState} />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-6">
                    <SegmentedControl label="Bit Depth" options={[16, 24]} value={bitDepth} onChange={(v) => handleValueChange('bitDepth', v)} />
                    <SegmentedControl label="Noise Shaping" options={['none', 'low', 'high']} value={noiseShaping} onChange={(v) => handleValueChange('noiseShaping', v)} />
                    <Knob label="Amount" value={ditherAmount} setValue={(v) => handleValueChange('ditherAmount', v)} paramName="ditherAmount" isLearning={isLearning('ditherAmount')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
