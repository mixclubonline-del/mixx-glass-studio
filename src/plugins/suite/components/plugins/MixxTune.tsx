import React, { useRef, useCallback, useEffect, useState } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxTuneSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const ToggleButton: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
            ${value ? 'bg-cyan-600/40 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}
        `}
    >
        {label}
    </button>
);

interface Particle {
    x: number;
    y: number;
    life: number;
    vx: number;
    vy: number;
}

const PitchVisualizer: React.FC<{ 
    retuneSpeed: number, 
    formant: number, // Added formant prop
    humanize: number, 
    emotiveLock: boolean, 
    mix: number, 
    audioSignal: PluginComponentProps['audioSignal'] 
}> = ({ retuneSpeed, formant, humanize, emotiveLock, mix, audioSignal }) => { // Destructure formant
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const targetNoteY = height / 2;
        const noteRange = height / 2.5;
        
        const normalizedRetune = retuneSpeed / 100;
        const normalizedHumanize = humanize / 100;
        const normalizedMix = mix / 100;
        const currentAudioLevel = audioSignal.level / 100; // Normalized 0-1

        // Draw enhanced notelane grid
        const numNoteLanes = 5;
        for(let i = 0; i < numNoteLanes; i++) {
            const y = targetNoteY - noteRange + (i * noteRange / (numNoteLanes - 1) * 2);
            // Simulate proximity glow + audio level influence
            const proximity = Math.max(0, 1 - Math.abs(y - targetNoteY) / noteRange);
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.05 + proximity * 0.1 * currentAudioLevel})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);


        // 1. Input Pitch Wave (audio-reactive)
        const inputWave = (x: number) => {
            const index = Math.floor((x / width) * audioSignal.waveform.length);
            // Formant influence: subtly shifts the perceived pitch range vertically
            const formantShift = (formant - 50) / 100 * noteRange * 0.2;
            return targetNoteY + formantShift + (audioSignal.waveform[index] * 2 - 1) * noteRange * 0.8;
        };
        
        // 2. Corrected Pitch Wave
        const correctedWave = (x: number) => {
            const inputY = inputWave(x);
            const error = inputY - targetNoteY;
            const correction = error * (1 - normalizedRetune);
            const humanizedDeviation = (Math.sin(audioSignal.time * 7 + x / 50) * Math.cos(audioSignal.time * 2) * 15) * normalizedHumanize;
            return targetNoteY + correction + humanizedDeviation;
        };

        // Draw paths
        const drawPath = (waveFunc: (x:number) => number, color: string, lineWidth: number, shadowBlur: number = 0, shadowColor: string = 'transparent') => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = shadowColor;
            ctx.beginPath();
            ctx.moveTo(0, waveFunc(0));
            for (let x = 1; x < width; x++) {
                ctx.lineTo(x, waveFunc(x));
            }
            ctx.stroke();
        };
        
        // Spawn particles along the corrected wave
        const lastCorrectedY = correctedWave(width - 1);
        // Influence particle emission by audio peaks
        if (audioSignal.peak > 80 && Math.random() > 0.6 && normalizedMix > 0.1) {
             particlesRef.current.push({ x: width, y: lastCorrectedY, life: 1, vx: -2, vy: (Math.random() - 0.5) * 0.5 });
        }
        
        // Update and draw particles
        ctx.fillStyle = emotiveLock ? `hsla(315, 90%, 85%, ${normalizedMix})` : `hsla(180, 90%, 75%, ${normalizedMix})`;
        particlesRef.current.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) {
                particlesRef.current.splice(index, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.life * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;


        // Draw the wavering input signal
        drawPath(inputWave, `rgba(255, 255, 255, ${0.4 * normalizedMix})`, 1.5);
        
        // Draw the powerful corrected signal
        const correctedColor = emotiveLock ? `hsla(315, 90%, 75%, ${0.5 + 0.5 * normalizedMix})` : `hsla(180, 90%, 65%, ${0.5 + 0.5 * normalizedMix})`;
        drawPath(correctedWave, correctedColor, 2.5, 10, correctedColor);

        // Reset shadow for next draw loop
        ctx.shadowBlur = 0;

        animationFrameRef.current = requestAnimationFrame(draw);
    }, [retuneSpeed, formant, humanize, emotiveLock, mix, audioSignal]); // Added formant to dependencies

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
            }
        }
        animationFrameRef.current = requestAnimationFrame(draw);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [draw]);

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-2 left-2 text-xs font-mono text-cyan-300/80 bg-black/50 px-2 py-1 rounded-md">
                Retune: {retuneSpeed.toFixed(0)}
            </div>
            <div className="absolute top-2 right-2 text-xs font-mono text-cyan-300/80 bg-black/50 px-2 py-1 rounded-md">
                Formant: {formant.toFixed(0)}
            </div>
            <div className="absolute bottom-2 left-2 text-xs font-mono text-cyan-300/80 bg-black/50 px-2 py-1 rounded-md">
                Humanize: {humanize.toFixed(0)}
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-mono text-cyan-300/80 bg-black/50 px-2 py-1 rounded-md">
                Mix: {mix.toFixed(0)}% <span className="ml-1 text-pink-300">{emotiveLock ? 'EMOTIVE LOCK ON' : ''}</span>
            </div>
        </div>
    );
};


export const MixxTune: React.FC<PluginComponentProps<MixxTuneSettings>> = ({ 
    isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn, audioSignal
}) => {
    const { 
        retuneSpeed, formant, humanize, emotiveLock, mix, output
    } = pluginState;
    
    const handleValueChange = (param: keyof MixxTuneSettings, value: number | boolean) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-tune', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-between gap-6 p-4">
                <div className="w-full h-48 border-2 border-cyan-400/30 rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.2)] bg-black/20 overflow-hidden">
                    <PitchVisualizer 
                        retuneSpeed={retuneSpeed} 
                        formant={formant} // Pass formant here
                        humanize={humanize} 
                        emotiveLock={emotiveLock} 
                        mix={mix} 
                        audioSignal={audioSignal} 
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <Knob label="Retune Speed" value={retuneSpeed} setValue={(val) => handleValueChange('retuneSpeed', val)} paramName="retuneSpeed" min={0} max={100} step={1} isLearning={isLearning('retuneSpeed')} onMidiLearn={onMidiLearn} />
                    <Knob label="Formant" value={formant} setValue={(val) => handleValueChange('formant', val)} paramName="formant" min={0} max={100} step={1} isLearning={isLearning('formant')} onMidiLearn={onMidiLearn} />
                    <Knob label="Humanize" value={humanize} setValue={(val) => handleValueChange('humanize', val)} paramName="humanize" min={0} max={100} step={1} isLearning={isLearning('humanize')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(val) => handleValueChange('mix', val)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(val) => handleValueChange('output', val)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
                
                <div className="flex justify-center">
                    <ToggleButton label="Emotive Lock" value={emotiveLock} onChange={(val) => handleValueChange('emotiveLock', val)} />
                </div>
            </div>
        </PluginContainer>
    );
};