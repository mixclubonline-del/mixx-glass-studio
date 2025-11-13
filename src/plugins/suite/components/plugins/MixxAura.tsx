
import React from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxAuraSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const ToggleButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
            ${value ? 'bg-pink-600/40 text-pink-200 shadow-[0_0_8px_rgba(236,72,153,0.4)]' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}
        `}
    >
        {label}
    </button>
);

const Nebula: React.FC<{ tone: number; width: number; shine: number; mood: string; moodLock: boolean; mix: number }> = 
({ tone, width, shine, mood, moodLock, mix }) => {
    const normalizedTone = tone / 100;
    const normalizedWidth = width / 100;
    const normalizedShine = shine / 100;
    const normalizedMix = mix / 100;

    const baseHue = moodLock ? 330 : {
        'Neutral': 240, 'Warm': 30, 'Bright': 180, 'Dark': 270, 'Energetic': 330
    }[mood] || 240;

    const hue1 = baseHue + (normalizedTone - 0.5) * 60;
    const hue2 = hue1 + 60;

    const starCount = Math.round(5 + normalizedShine * 50);

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden [perspective:1000px]">
            {/* Nebula Layers */}
            <div className="absolute w-full h-full transition-transform duration-500" style={{transform: `scale(${1 + normalizedWidth * 0.5})`, opacity: normalizedMix}}>
                <div className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] rounded-full" style={{
                    background: `radial-gradient(circle, hsla(${hue1}, 90%, 60%, 0.5) 0%, transparent 70%)`,
                    animation: `nebula-rotate ${25 - normalizedWidth * 15}s linear infinite`,
                }} />
                <div className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] rounded-full" style={{
                    background: `radial-gradient(circle, hsla(${hue2}, 90%, 60%, 0.5) 0%, transparent 70%)`,
                    animation: `nebula-rotate ${30 - normalizedWidth * 15}s linear infinite reverse`,
                }} />
            </div>

            {/* Stars */}
            <div className="absolute w-full h-full">
                {Array.from({ length: starCount }).map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: normalizedShine * (0.5 + Math.random() * 0.5),
                        animation: `sparkle-animation ${2 + Math.random() * 3}s infinite ease-in-out`,
                        animationDelay: `${Math.random() * 5}s`,
                    }} />
                ))}
            </div>

             <style>{`
                @keyframes nebula-rotate {
                    from { transform: rotate(0deg) scale(1); }
                    to { transform: rotate(360deg) scale(1.1); }
                }
            `}</style>
        </div>
    );
};

export const MixxAura: React.FC<PluginComponentProps<MixxAuraSettings>> = ({ 
  isDragging, isResizing, name, description, sessionContext, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { tone, width, shine, moodLock, mix, output } = pluginState;

    const handleValueChange = (param: keyof MixxAuraSettings, value: number | boolean) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-aura', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="relative w-full flex-1 bg-black/20 border border-pink-400/20 rounded-lg">
                    <Nebula tone={tone} width={width} shine={shine} mood={sessionContext.mood} moodLock={moodLock} mix={mix} />
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Tone" value={tone} setValue={(v) => handleValueChange('tone', v)} paramName="tone" isLearning={isLearning('tone')} onMidiLearn={onMidiLearn} />
                    <Knob label="Width" value={width} setValue={(v) => handleValueChange('width', v)} paramName="width" isLearning={isLearning('width')} onMidiLearn={onMidiLearn} />
                    <Knob label="Shine" value={shine} setValue={(v) => handleValueChange('shine', v)} paramName="shine" isLearning={isLearning('shine')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
                <div className="flex justify-center">
                    <ToggleButton label="Mood Lock" value={moodLock} onChange={(v) => handleValueChange('moodLock', v)} />
                </div>
            </div>
        </PluginContainer>
    );
};