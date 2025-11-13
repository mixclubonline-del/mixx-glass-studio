
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxBrainwaveSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const BrainwaveVisualizer: React.FC<{ seed: number, variation: number, intensity: number, isThinking: boolean }> = ({ seed, variation, intensity, isThinking }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        if (!isThinking) return;

        const numLines = 10 + Math.floor((intensity/100) * 40);
        const rand = (s: number) => () => (s = Math.sin(s) * 10000, s - Math.floor(s));
        const seededRand = rand(seed);

        ctx.strokeStyle = `hsl(250, 80%, 70%)`;
        ctx.lineWidth = 1 + (variation/100) * 2;

        for (let i = 0; i < numLines; i++) {
            ctx.beginPath();
            ctx.moveTo(seededRand() * width, seededRand() * height);
            ctx.lineTo(seededRand() * width, seededRand() * height);
            ctx.stroke();
        }

    }, [seed, variation, intensity, isThinking]);
    
    useEffect(() => {
        if (isThinking) {
            draw();
        } else {
            const canvas = canvasRef.current;
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [isThinking, draw]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export const MixxBrainwave: React.FC<PluginComponentProps<MixxBrainwaveSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { seed, variation, intensity, mix, output } = pluginState;
    const [isThinking, setIsThinking] = useState(false);

    const handleValueChange = (param: keyof MixxBrainwaveSettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-brainwave', parameter: param, value });
    };

    const generateIdea = () => {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 1500);
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full flex-1 bg-black/20 border border-purple-400/20 rounded-lg">
                    <BrainwaveVisualizer seed={seed} variation={variation} intensity={intensity} isThinking={isThinking} />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Knob label="Seed" value={seed} setValue={(v) => handleValueChange('seed', v)} paramName="seed" isLearning={isLearning('seed')} onMidiLearn={onMidiLearn} />
                    <Knob label="Variation" value={variation} setValue={(v) => handleValueChange('variation', v)} paramName="variation" isLearning={isLearning('variation')} onMidiLearn={onMidiLearn} />
                    <Knob label="Intensity" value={intensity} setValue={(v) => handleValueChange('intensity', v)} paramName="intensity" isLearning={isLearning('intensity')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
                 <button 
                    onClick={generateIdea} 
                    disabled={isThinking}
                    className="px-8 py-4 bg-purple-600/50 rounded-lg text-white font-bold text-lg hover:bg-purple-600/70 transition-all disabled:opacity-50"
                >
                    {isThinking ? `GENERATING...` : 'GENERATE IDEA'}
                </button>
            </div>
        </PluginContainer>
    );
};