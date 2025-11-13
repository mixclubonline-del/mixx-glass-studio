
import React, { useState, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { PrimeEQSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const EQVisualizer: React.FC<{ low: number, mid: number, high: number, focus: number }> = ({ low, mid, high, focus }) => {
    const [spectrum, setSpectrum] = useState<number[]>(Array(64).fill(0));
    const width = 500, height = 100;
    const numBars = spectrum.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setSpectrum(spec => spec.map(v => Math.max(0, v * 0.7 + (Math.random() * 40 - 10))));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const eqCurve = (pos: number) => {
        const lowInf = Math.pow(1 - pos, 2);
        const midInf = Math.max(0, 1 - Math.abs(pos - 0.5) * 3);
        const highInf = Math.pow(pos, 2);
        return height / 2 - (low * lowInf + mid * midInf + high * highInf) * 3;
    };

    const pathData = Array.from({ length: 100 }).map((_, i) => {
        const x = (i / 99) * width;
        const y = eqCurve(i / 99);
        return `${x},${y}`;
    }).join(' L ');
    
    const focusX = (focus / 100) * width;
    const focusIndex = Math.round((focus / 100) * numBars);
    const focusWidth = Math.max(2, (1 - focus / 150) * 10); // Narrower highlight as focus increases

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="prime-eq-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ffff" />
                    <stop offset="100%" stopColor="#A57CFF" />
                </linearGradient>
                <linearGradient id="prime-eq-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00ffff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#A57CFF" stopOpacity="0" />
                </linearGradient>
                <filter id="prime-eq-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            
            {/* Spectrum Analyzer Background */}
            <g>
                {spectrum.map((val, i) => {
                    const isFocused = Math.abs(i - focusIndex) < focusWidth && focus > 0;
                    const baseOpacity = 0.1;
                    const focusedOpacity = 0.25;
                    const opacity = isFocused ? focusedOpacity : baseOpacity;
                    return (
                        <rect 
                            key={i}
                            x={(i / numBars) * width}
                            y={height - (val / 100 * height)}
                            width={width / numBars}
                            height={val / 100 * height}
                            fill={`rgba(0, 255, 255, ${opacity})`}
                            className="transition-colors duration-300"
                        />
                    )
                })}
            </g>

            {/* EQ Curve Fill */}
            <path d={`M 0,${eqCurve(0)} L ${pathData} L ${width},${height} L 0,${height} Z`} fill="url(#prime-eq-fill)" />

            {/* EQ Curve Line */}
            <path d={`M 0,${eqCurve(0)} L ${pathData}`} fill="none" stroke="url(#prime-eq-grad)" strokeWidth="2.5" filter="url(#prime-eq-glow)" />

            {/* Smart Focus Reticle */}
            <g transform={`translate(${focusX}, ${eqCurve(focus/100)})`} className="transition-transform duration-300" style={{opacity: focus > 0 ? 1 : 0}}>
                <circle cx="0" cy="0" r="10" fill="none" stroke="#f472b6" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 0 -15 V 15 M -15 0 H 15" stroke="#f472b6" strokeWidth="1" />
            </g>
        </svg>
    );
};

export const PrimeEQ: React.FC<PluginComponentProps<PrimeEQSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { lowGain, midGain, highGain, smartFocus, mix, output } = pluginState;

    const handleValueChange = (param: keyof PrimeEQSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'prime-eq', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full h-40 border-y-2 border-cyan-400/20 py-4">
                    <EQVisualizer low={lowGain} mid={midGain} high={highGain} focus={smartFocus} />
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Low Gain" value={lowGain} setValue={(v) => handleValueChange('lowGain', v)} min={-12} max={12} step={0.1} paramName="lowGain" isLearning={isLearning('lowGain')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mid Gain" value={midGain} setValue={(v) => handleValueChange('midGain', v)} min={-12} max={12} step={0.1} paramName="midGain" isLearning={isLearning('midGain')} onMidiLearn={onMidiLearn} />
                    <Knob label="High Gain" value={highGain} setValue={(v) => handleValueChange('highGain', v)} min={-12} max={12} step={0.1} paramName="highGain" isLearning={isLearning('highGain')} onMidiLearn={onMidiLearn} />
                    <Knob label="Smart Focus" value={smartFocus} setValue={(v) => handleValueChange('smartFocus', v)} paramName="smartFocus" isLearning={isLearning('smartFocus')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
