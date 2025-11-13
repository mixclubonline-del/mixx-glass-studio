
import React, { useMemo } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxSoulSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const SoulVisualizer: React.FC<{ empathy: number, depth: number, tone: number, vibe: number }> = 
({ empathy, depth, tone, vibe }) => {
    const particleCount = 20 + Math.round(depth / 100 * 80);
    
    const particles = useMemo(() => Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        size: 5 + Math.random() * 15,
        duration: 8 + Math.random() * 8, // Longer, more graceful movement
        delay: Math.random() * 10,
        orbit: 10 + Math.random() * 40,
        wobbleAmount: `${(Math.random() - 0.5) * 20}px`,
        wobbleDuration: 2 + Math.random() * 2,
    })), [particleCount]);

    const normalizedEmpathy = empathy / 100;
    const normalizedTone = tone / 100;
    const normalizedVibe = vibe / 100;

    const baseHue = 210; // Blue
    const targetHue = 50; // Gold
    const hue = baseHue + (targetHue - baseHue) * normalizedEmpathy;
    const animationSpeed = 1 / (0.5 + normalizedVibe * 1.5);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute"
                    style={{
                        width: `${p.orbit}%`,
                        height: `${p.orbit}%`,
                        animation: `soul-orbit ${p.duration * animationSpeed}s ${p.delay}s infinite linear`,
                    }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full">
                         <div
                            className="absolute rounded-full"
                            style={{
                                width: p.size,
                                height: p.size,
                                top: 0,
                                left: 0,
                                background: `radial-gradient(circle, hsla(${hue + (Math.random() - 0.5) * 20}, ${80 + normalizedTone * 20}%, 70%, 0.8) 0%, transparent 70%)`,
                                filter: `blur(${2 + Math.random() * 3}px)`,
                                '--wobble-amount': p.wobbleAmount,
                                animation: `soul-wobble ${p.wobbleDuration * animationSpeed}s infinite ease-in-out`,
                            } as React.CSSProperties}
                         />
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes soul-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes soul-wobble {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(var(--wobble-amount)); }
                }
            `}</style>
        </div>
    );
};

export const MixxSoul: React.FC<PluginComponentProps<MixxSoulSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { empathy, depth, tone, vibe, mix, output } = pluginState;

    const handleValueChange = (param: keyof MixxSoulSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-soul', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 rounded-lg border border-yellow-300/20 bg-black/20 overflow-hidden">
                    <SoulVisualizer empathy={empathy} depth={depth} tone={tone} vibe={vibe} />
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Empathy" value={empathy} setValue={(v) => handleValueChange('empathy', v)} paramName="empathy" isLearning={isLearning('empathy')} onMidiLearn={onMidiLearn} />
                    <Knob label="Depth" value={depth} setValue={(v) => handleValueChange('depth', v)} paramName="depth" isLearning={isLearning('depth')} onMidiLearn={onMidiLearn} />
                    <Knob label="Tone" value={tone} setValue={(v) => handleValueChange('tone', v)} paramName="tone" isLearning={isLearning('tone')} onMidiLearn={onMidiLearn} />
                    <Knob label="Vibe" value={vibe} setValue={(v) => handleValueChange('vibe', v)} paramName="vibe" isLearning={isLearning('vibe')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
