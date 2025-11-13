
import React from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { PrimeMasterEQSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const ToggleButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
            ${value ? 'bg-amber-400/40 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}
        `}
    >
        {label}
    </button>
);

const MasterEQVisualizer: React.FC<PrimeMasterEQSettings> = ({ lowShelfFreq, lowShelfGain, highShelfFreq, highShelfGain, midSideMode }) => {
    const width = 800, height = 200;
    const logMinFreq = Math.log10(20);
    const logMaxFreq = Math.log10(20000);

    const freqToX = (freq: number) => {
        const logFreq = Math.log10(freq);
        return ((logFreq - logMinFreq) / (logMaxFreq - logMinFreq)) * width;
    };

    const pathData = Array.from({ length: 200 }).map((_, i) => {
        const x = (i / 199) * width;
        const linearPos = x / width;
        const freq = Math.pow(10, logMinFreq + linearPos * (logMaxFreq - logMinFreq));

        let gain = 0;
        // Low Shelf
        if (freq < lowShelfFreq) {
            gain += lowShelfGain;
        } else {
             const x = 1 + (Math.log2(freq) - Math.log2(lowShelfFreq)) * 2;
             gain += lowShelfGain / (1 + x*x);
        }

        // High Shelf
        if (freq > highShelfFreq) {
            gain += highShelfGain;
        } else {
            const x = 1 + (Math.log2(highShelfFreq) - Math.log2(freq)) * 2;
            gain += highShelfGain / (1 + x*x);
        }

        const y = height / 2 - (gain / 24) * (height / 2); // Map +/- 12dB to view, giving some headroom
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' L ');

    const midColor = midSideMode ? "hsl(180, 80%, 70%)" : "hsl(50, 100%, 85%)";
    const sideColor = "hsl(300, 80%, 70%)";

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
             <defs>
                <linearGradient id="master-eq-grad-mid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={midColor} />
                    <stop offset="100%" stopColor={midColor} />
                </linearGradient>
                 <linearGradient id="master-eq-grad-side" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={sideColor} />
                    <stop offset="100%" stopColor={sideColor} />
                </linearGradient>
                <filter id="master-eq-glow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Grid */}
            <g opacity="0.1">
                <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="white" strokeWidth="1" />
                {[30, 100, 300, 1000, 3000, 10000].map(f => (
                    <line key={f} x1={freqToX(f)} y1="0" x2={freqToX(f)} y2={height} stroke="white" strokeWidth="1" />
                ))}
            </g>

            {/* EQ Curve Line */}
            <path d={`M 0,${height/2} L ${pathData}`} fill="none" stroke={`url(#master-eq-grad-mid)`} strokeWidth="2.5" filter="url(#master-eq-glow)" />

            {/* Side curve when in M/S mode */}
            {midSideMode && (
                 <path d={`M 0,${height/2} L ${pathData}`} fill="none" stroke={`url(#master-eq-grad-side)`} strokeWidth="1.5" filter="url(#master-eq-glow)" transform={`translate(0, 5)`} opacity="0.7" />
            )}

             <text x="10" y="20" fill="white" opacity="0.2" fontSize="12" fontFamily="Roboto">20Hz</text>
             <text x={width - 40} y="20" fill="white" opacity="0.2" fontSize="12" fontFamily="Roboto">20kHz</text>
        </svg>
    );
};

export const PrimeMasterEQ: React.FC<PluginComponentProps<PrimeMasterEQSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { lowShelfFreq, lowShelfGain, highShelfFreq, highShelfGain, midSideMode, output } = pluginState;

    const handleValueChange = (param: keyof PrimeMasterEQSettings, value: number | boolean) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'prime-master-eq', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full h-48 border-y-2 border-amber-300/20 py-4">
                    <MasterEQVisualizer {...pluginState} />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Knob label="LS Freq" value={lowShelfFreq} setValue={(v) => handleValueChange('lowShelfFreq', v)} min={20} max={800} step={1} paramName="lowShelfFreq" isLearning={isLearning('lowShelfFreq')} onMidiLearn={onMidiLearn} />
                    <Knob label="LS Gain" value={lowShelfGain} setValue={(v) => handleValueChange('lowShelfGain', v)} min={-12} max={12} step={0.1} paramName="lowShelfGain" isLearning={isLearning('lowShelfGain')} onMidiLearn={onMidiLearn} />
                    <Knob label="HS Freq" value={highShelfFreq} setValue={(v) => handleValueChange('highShelfFreq', v)} min={1000} max={20000} step={100} paramName="highShelfFreq" isLearning={isLearning('highShelfFreq')} onMidiLearn={onMidiLearn} />
                    <Knob label="HS Gain" value={highShelfGain} setValue={(v) => handleValueChange('highShelfGain', v)} min={-12} max={12} step={0.1} paramName="highShelfGain" isLearning={isLearning('highShelfGain')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                    <div className="w-28 flex justify-center items-end">
                      <ToggleButton label="M/S Mode" value={midSideMode} onChange={(v) => handleValueChange('midSideMode', v)} />
                    </div>
                </div>
            </div>
        </PluginContainer>
    );
};
