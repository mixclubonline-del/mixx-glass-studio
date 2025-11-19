
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxVerbSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

interface Particle {
    id: number;
    angle: number;
    distance: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    color: string;
}

const ParticleField: React.FC<{ size: number, predelay: number, mix: number }> = ({ size, predelay, mix }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const particleIdCounter = React.useRef(0);

    const triggerBurst = useCallback(() => {
        const particleCount = 10 + Math.round(size / 100 * 40);
        const normalizedMix = mix / 100;
        if (normalizedMix < 0.01) return;

        const newParticles: Particle[] = Array.from({ length: particleCount }).map(() => {
            const lifetime = 2 + (size / 100) * 8;
            const perspective = Math.random(); // 0 is far, 1 is near
            particleIdCounter.current++;
            
            return {
                id: particleIdCounter.current,
                angle: Math.random() * 360,
                distance: 10 + Math.random() * 40 * perspective * (1 + size / 100),
                size: (1 + perspective * 3) * (5 + Math.random() * 5),
                opacity: (0.1 + perspective * 0.4) * normalizedMix,
                duration: lifetime * (0.8 + Math.random() * 0.4),
                delay: predelay / 1000,
                color: `hsl(${180 + perspective * 90}, 80%, 70%)`,
            };
        });
        setParticles(p => [...p.slice(-100), ...newParticles]); // Keep DOM from getting overloaded
    }, [size, predelay, mix]);

    useEffect(() => {
        const interval = setInterval(triggerBurst, 2000); // Simulate a sound event
        return () => clearInterval(interval);
    }, [triggerBurst]);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden [perspective:800px]">
            {/* Central pulse on burst */}
            <div 
                key={particleIdCounter.current} // Remount to replay animation
                className="absolute w-4 h-4 rounded-full bg-cyan-400"
                style={{
                    animation: `reverb-core-pulse ${predelay + 500}ms ease-out`,
                    opacity: 0,
                }}
            />

            {particles.map((p: Particle) => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        top: '50%',
                        left: '50%',
                        backgroundColor: p.color,
                        opacity: 0,
                        animation: `reverb-particle ${p.duration}s ${p.delay}s forwards ease-out`,
                        '--angle': `${p.angle}deg`,
                        '--distance': `${p.distance}%`,
                        '--opacity': p.opacity
                    } as React.CSSProperties}
                    onAnimationEnd={() => {
                        setParticles(currentParticles => currentParticles.filter(cp => cp.id !== p.id));
                    }}
                />
            ))}
             <style>{`
                @keyframes reverb-particle {
                    0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0); opacity: var(--opacity); }
                    70% { opacity: calc(var(--opacity) * 0.3); }
                    100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(var(--distance)) scale(1.5); opacity: 0; }
                }
                @keyframes reverb-core-pulse {
                    0% { transform: scale(0); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};


export const MixxVerb: React.FC<PluginComponentProps<MixxVerbSettings>> = ({ 
  isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { size, predelay, mix, output } = pluginState; 

    // Register plugin with Flow
    const { broadcast } = useFlowComponent({
        id: `plugin-mixx-verb-${name}`,
        type: 'plugin',
        name: `Mixx Verb: ${name}`,
        broadcasts: ['parameter_change', 'state_change'],
        listens: [
            {
                signal: 'prime_brain_guidance',
                callback: (payload) => {
                    // Prime Brain can guide plugin behavior
                },
            },
        ],
    });

    const handleValueChange = (param: keyof MixxVerbSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-verb', parameter: param, value });
        // Also broadcast to Flow
        broadcast('parameter_change', { plugin: 'mixx-verb', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="relative flex-1 w-full flex items-center justify-center bg-black/20 rounded-lg border border-cyan-400/20">
                    <ParticleField size={size} predelay={predelay} mix={mix} />
                     <div className="absolute font-orbitron text-cyan-200/50 text-4xl font-bold select-none">{size.toFixed(0)}m</div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Size" value={size} setValue={(v) => handleValueChange('size', v)} paramName="size" isLearning={isLearning('size')} onMidiLearn={onMidiLearn} />
                    <Knob label="Pre-Delay" value={predelay} setValue={(v) => handleValueChange('predelay', v)} min={0} max={150} step={1} paramName="predelay" isLearning={isLearning('predelay')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
