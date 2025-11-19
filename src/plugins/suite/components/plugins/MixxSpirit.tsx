
import React, { useState, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxSpiritSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const SpiritVisualizer: React.FC<{ sensitivity: number, energyLink: number, threshold: number }> = 
({ sensitivity, energyLink, threshold }) => {
    const [energy, setEnergy] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const energySurge = Math.pow(Math.random(), 4) * (energyLink / 100 * 50);
            setEnergy(prev => Math.min(100, prev * 0.9 + energySurge));
        }, 200);
        return () => clearInterval(interval);
    }, [energyLink]);

    const isAboveThreshold = energy > threshold;
    const strobeOpacity = isAboveThreshold ? 0.05 + (sensitivity / 100) * 0.2 * (energy / 100) : 0;
    
    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div 
                className="absolute inset-0 bg-white transition-opacity duration-100 pointer-events-none"
                style={{ opacity: strobeOpacity }}
            />
            {Array.from({length: 50}).map((_, i) => (
                <div key={i} className="absolute w-1 h-1 rounded-full" style={{
                    left: `${Math.random()*100}%`,
                    top: `${Math.random()*100}%`,
                    background: `hsl(${180 + Math.random()*180}, 90%, 70%)`,
                    transform: `scale(${1 + energy/100 * 2})`,
                    opacity: 0.1 + energy/100 * 0.6,
                    transition: 'all 0.2s ease-out'
                }}/>
            ))}
            <div className="absolute bottom-4 w-3/4 h-4 bg-black/30 rounded-full border border-white/10">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 rounded-full" style={{ width: `${energy}%` }} />
                <div className="absolute top-0 h-full w-px bg-white" style={{ left: `${threshold}%` }} />
            </div>
        </div>
    );
};

export const MixxSpirit: React.FC<PluginComponentProps<MixxSpiritSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { sensitivity, energyLink, threshold, mix, output } = pluginState;

    // Register plugin with Flow
    const { broadcast } = useFlowComponent({
        id: `plugin-mixx-spirit-${name}`,
        type: 'plugin',
        name: `Mixx Spirit: ${name}`,
        broadcasts: ['parameter_change', 'state_change'],
        listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
    });

    const handleValueChange = (param: keyof MixxSpiritSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-spirit', parameter: param, value });
        broadcast('parameter_change', { plugin: 'mixx-spirit', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 rounded-lg border border-white/10 bg-black/20">
                    <SpiritVisualizer sensitivity={sensitivity} energyLink={energyLink} threshold={threshold} />
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Sensitivity" value={sensitivity} setValue={(v) => handleValueChange('sensitivity', v)} paramName="sensitivity" isLearning={isLearning('sensitivity')} onMidiLearn={onMidiLearn} />
                    <Knob label="Energy Link" value={energyLink} setValue={(v) => handleValueChange('energyLink', v)} paramName="energyLink" isLearning={isLearning('energyLink')} onMidiLearn={onMidiLearn} />
                    <Knob label="Threshold" value={threshold} setValue={(v) => handleValueChange('threshold', v)} paramName="threshold" isLearning={isLearning('threshold')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};