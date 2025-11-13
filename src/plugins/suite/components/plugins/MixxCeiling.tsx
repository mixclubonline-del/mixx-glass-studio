
import React, { useState, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxCeilingSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const CeilingVisualizer: React.FC<{ level: number, softClip: number, tone: number }> = ({ level, softClip, tone }) => {
    const [waveform, setWaveform] = useState<number[]>(Array(100).fill(0));
    const [peak, setPeak] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const newWave = Array(100).fill(0).map((_, i) => {
                const time = Date.now() / 200 + i / 10;
                const baseWave = (Math.sin(time) * 0.5 + Math.sin(time * 2.1) * 0.3 + Math.sin(time*0.5)*0.2);
                return (baseWave + 1) / 2; // Normalize to 0-1
            });
            setWaveform(newWave);
            setPeak(Math.max(...newWave));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const ceilingPos = 1 - (level / 100); // 0 (top) to 1 (bottom)
    const kneeWidth = (softClip / 100) * 0.1;

    const pathData = waveform.map((v, i) => {
        const x = (i / (waveform.length - 1)) * 100;
        let y = (1 - v) * 100; // y position in percentage
        
        // Soft clipping logic
        const ceilingY = ceilingPos * 100;
        if (y < ceilingY + kneeWidth) {
            const dy = (ceilingY + kneeWidth - y) / (2 * kneeWidth);
            y = ceilingY + kneeWidth - Math.tanh(dy) * kneeWidth;
        }
        
        return `${x},${y}`;
    }).join(' L ');
    
    const color = `hsl(60, ${100 - tone * 0.5}%, ${80 + tone * 0.15}%)`;
    const isClipping = peak > ceilingPos;

    return (
        <div className="relative w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Waveform */}
                <path d={`M 0,${(1-waveform[0])*100} L ${pathData}`} stroke={color} strokeWidth="1.5" fill="none" style={{filter: `drop-shadow(0 0 5px ${color})`}}/>
                
                {/* Ceiling line */}
                <line x1="0" y1={`${ceilingPos*100}%`} x2="100%" y2={`${ceilingPos*100}%`} stroke={color} strokeWidth="1" strokeDasharray="2 4" strokeOpacity="0.5"/>
                
                {/* Energy Discharge on Clip */}
                {isClipping && (
                    <line 
                        x1="0" y1={`${ceilingPos*100}%`} x2="100%" y2={`${ceilingPos*100}%`}
                        stroke={color}
                        strokeWidth={2 + (1 - softClip/100) * 4}
                        strokeOpacity="1"
                        style={{
                           filter: `blur(${(softClip/100) * 3}px) drop-shadow(0 0 10px ${color})`,
                           animation: 'knob-value-flash 0.1s ease-out',
                        }}
                    />
                )}
            </svg>
        </div>
    );
};

export const MixxCeiling: React.FC<PluginComponentProps<MixxCeilingSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { level, softClip, tone, mix, output } = pluginState;

    const handleValueChange = (param: keyof MixxCeilingSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-ceiling', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 border border-amber-300/20 rounded-lg bg-black/20">
                    <CeilingVisualizer level={level} softClip={softClip} tone={tone} />
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Level" value={level} setValue={(v) => handleValueChange('level', v)} paramName="level" isLearning={isLearning('level')} onMidiLearn={onMidiLearn} />
                    <Knob label="Soft Clip" value={softClip} setValue={(v) => handleValueChange('softClip', v)} paramName="softClip" isLearning={isLearning('softClip')} onMidiLearn={onMidiLearn} />
                    <Knob label="Tone" value={tone} setValue={(v) => handleValueChange('tone', v)} paramName="tone" isLearning={isLearning('tone')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};