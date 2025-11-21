
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { MixxAnalyzerProSettings, PluginComponentProps } from '../../types';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const Analyzer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [lufs, setLufs] = useState({ i: -23, s: -18, m: -16 });
    const [truePeak, setTruePeak] = useState(-1.1);
    const [correlation, setCorrelation] = useState(0.8);
    const peakLevelsRef = useRef<number[]>([]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = canvas;
        const bars = 128;
        if (peakLevelsRef.current.length !== bars) {
            peakLevelsRef.current = Array(bars).fill(0);
        }
        const barWidth = width / bars;
        
        // Shift existing content for waterfall effect
        ctx.globalAlpha = 0.95;
        ctx.drawImage(canvas, 0, 1);
        ctx.globalAlpha = 1.0;
        
        // Clear the top line for new data
        ctx.clearRect(0, 0, width, 1);

        // Draw new spectrum line at the top
        for (let i = 0; i < bars; i++) {
            const power = Math.pow(Math.random(), 2);
            const hue = 210 + (i / bars) * 90;
            ctx.fillStyle = `hsla(${hue}, 90%, ${65 * power}%, 1)`;
            ctx.fillRect(i * barWidth, 0, barWidth, 1);

            // Update and draw peak trail
            peakLevelsRef.current[i] = Math.max(power, peakLevelsRef.current[i] * 0.99);
            const peakY = (1 - peakLevelsRef.current[i]) * height;
            if (peakY < height - 1) { // Only draw if not at the bottom
                 ctx.fillStyle = `hsla(${hue}, 90%, 85%, 0.8)`;
                 ctx.fillRect(i * barWidth, peakY, barWidth, 1);
            }
        }
    }, []);
    
    useEffect(() => {
        const drawInterval = setInterval(draw, 50);
        const lufsInterval = setInterval(() => {
            setLufs(l => ({
                i: l.i + (Math.random()-0.5)*0.1,
                s: -12 + (Math.random()-0.5)*10,
                m: -10 + (Math.random()-0.5)*8,
            }));
            setTruePeak(-2 + Math.random());
            setCorrelation(Math.random() * 2 - 1);
        }, 500);

        return () => {
            clearInterval(drawInterval);
            clearInterval(lufsInterval);
        };
    }, [draw]);

    return (
        <div className="w-full h-full flex gap-4">
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-lg [perspective:1000px] overflow-hidden">
                    <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{transform: 'rotateX(30deg) scale(1.2)'}}/>
                </div>
                <div className="h-6 bg-black/30 rounded-full border border-white/10 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-full w-px bg-white/30" />
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded-sm transition-all duration-100" style={{
                        left: `${(correlation + 1) / 2 * 100}%`,
                        transform: `translateX(-50%) translateY(-50%)`,
                        background: `hsl(${correlation * 60 + 60}, 100%, 60%)`,
                    }}/>
                </div>
            </div>
            <div className="w-48 flex flex-col justify-around text-right font-mono">
                <div>
                    <span className="text-white/50 block">Integrated</span>
                    <span className="text-2xl text-cyan-300">{lufs.i.toFixed(1)} LUFS</span>
                </div>
                 <div>
                    <span className="text-white/50 block">Short Term</span>
                    <span className="text-2xl text-cyan-300">{lufs.s.toFixed(1)} LUFS</span>
                </div>
                 <div>
                    <span className="text-white/50 block">Momentary</span>
                    <span className="text-2xl text-cyan-300">{lufs.m.toFixed(1)} LUFS</span>
                </div>
                 <div>
                    <span className="text-white/50 block">True Peak</span>
                    <span className="text-2xl text-cyan-300">{truePeak.toFixed(1)} dBTP</span>
                </div>
            </div>
        </div>
    );
}

export const MixxAnalyzerPro: React.FC<PluginComponentProps<MixxAnalyzerProSettings>> = ({ 
    isDragging, isResizing, name, description
}) => {
    // Register plugin with Flow
    useFlowComponent({
        id: `plugin-mixx-analyzer-pro-${name}`,
        type: 'plugin',
        name: `Mixx Analyzer Pro: ${name}`,
        broadcasts: ['state_change'],
        listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
    });

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full p-4">
                <Analyzer />
            </div>
        </PluginContainer>
    );
};