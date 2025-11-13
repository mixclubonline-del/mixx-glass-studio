
import React, { useMemo } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxMotionSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const ToggleButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
            ${value ? 'bg-fuchsia-600/40 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.4)]' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}
        `}
    >
        {label}
    </button>
);

const MotionGrid: React.FC<{ rate: number, depth: number, sync: boolean }> = ({ rate, depth, sync }) => {
    const grid_size = 20;
    const animationDuration = sync ? '1s' : `${Math.max(0.2, 3 - (rate / 100) * 2.8)}s`;
    const animationTimingFunction = sync ? 'cubic-bezier(0.65, 0, 0.35, 1)' : 'ease-in-out';
    
    const dots = useMemo(() => Array.from({length: grid_size * grid_size}).map((_, i) => ({
        key: i,
        x: (i % grid_size) / (grid_size - 1) * 100,
        y: Math.floor(i / grid_size) / (grid_size - 1) * 100,
        delay: (i % grid_size) * 0.05,
    })), []);

    return (
        <div className="relative w-full h-full flex items-center justify-center [perspective:500px]">
            <div className="w-[80%] h-[80%] relative" style={{transform: 'rotateX(60deg)'}}>
                {dots.map(dot => (
                    <div key={dot.key} className="absolute w-1.5 h-1.5 rounded-full bg-fuchsia-400" style={{
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        '--depth': `${(depth / 100) * 50}%`,
                        animation: `wave ${animationDuration} infinite alternate ${animationTimingFunction}`,
                        animationDelay: `${dot.delay}s`,
                    } as React.CSSProperties} />
                ))}
            </div>
            <style>{`
                @keyframes wave {
                    from { transform: translateY(var(--depth)); }
                    to { transform: translateY(calc(var(--depth) * -1)); }
                }
            `}</style>
        </div>
    );
};

export const MixxMotion: React.FC<PluginComponentProps<MixxMotionSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { rate, depth, sync, mix, output } = pluginState;

    const handleValueChange = (param: keyof MixxMotionSettings, value: number | boolean) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-motion', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 overflow-hidden bg-black/20 border border-fuchsia-500/20 rounded-lg">
                    <MotionGrid rate={rate} depth={depth} sync={sync} />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Knob label="Rate" value={rate} setValue={(v) => handleValueChange('rate', v)} paramName="rate" isLearning={isLearning('rate')} onMidiLearn={onMidiLearn} />
                    <Knob label="Depth" value={depth} setValue={(v) => handleValueChange('depth', v)} paramName="depth" isLearning={isLearning('depth')} onMidiLearn={onMidiLearn} />
                    <ToggleButton label="Sync" value={sync} onChange={(v) => handleValueChange('sync', v)} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
