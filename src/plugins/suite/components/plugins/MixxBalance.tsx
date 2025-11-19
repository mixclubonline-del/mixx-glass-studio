

import React, { useRef, useCallback, useEffect } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { MixxBalanceSettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';
import { useFlowComponent } from '../../../../core/flow/useFlowComponent';

const Vectorscope: React.FC<{ widthParam: number, phaseParam: number, tiltParam: number }> = ({ widthParam, phaseParam, tiltParam }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const correlation = Math.cos((phaseParam / 100) * Math.PI); // -1 to 1

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.45;
        
        // Fade out previous frame for persistence effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();

        const normalizedWidth = widthParam / 100;
        const normalizedPhase = (phaseParam / 100) * Math.PI;
        const normalizedTilt = (tiltParam - 50) / 50;
        const time = Date.now() / 300;
        
        ctx.strokeStyle = `hsl(210, 90%, 75%)`;
        ctx.shadowColor = `hsl(210, 90%, 75%)`;
        ctx.shadowBlur = 5 + normalizedWidth * 15;
        ctx.lineWidth = 1.5 + normalizedWidth * 1.5;
        ctx.beginPath();

        for (let i = 0; i < 200; i++) {
            const angle = (i / 199) * Math.PI * 2;
            const l = Math.sin(angle * 3 + time) + Math.cos(angle * 2 - time) * 0.5;
            const r = Math.sin(angle * 3 + time + normalizedPhase) + Math.cos(angle * 2 - time + normalizedPhase) * 0.5;
            
            const x = (l - r) * 0.5 * radius * (1 + normalizedWidth);
            const y = (l + r) * 0.5 * radius * (1 + normalizedTilt * 0.5);
            
            if (i === 0) ctx.moveTo(centerX + x, centerY - y);
            else ctx.lineTo(centerX + x, centerY - y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for next frame

    }, [widthParam, phaseParam, tiltParam]);

    useEffect(() => {
        let animationFrameId: number;
        const animate = () => {
            render();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [render]);

    return (
        <div className="w-full h-full flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="w-3/4 h-6 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full border border-white/10 relative p-0.5">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-full w-px bg-white/30" />
                <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-white rounded-sm shadow-md transition-all duration-100" style={{
                    left: `${(correlation + 1) / 2 * 100}%`,
                    transform: `translateX(-50%) translateY(-50%)`,
                }}/>
            </div>
        </div>
    );
};


export const MixxBalance: React.FC<PluginComponentProps<MixxBalanceSettings>> = ({
  isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
  const { width, phase, tilt, mix, output } = pluginState;
  
  // Register plugin with Flow
  const { broadcast } = useFlowComponent({
    id: `plugin-mixx-balance-${name}`,
    type: 'plugin',
    name: `Mixx Balance: ${name}`,
    broadcasts: ['parameter_change', 'state_change'],
    listens: [{ signal: 'prime_brain_guidance', callback: () => {} }],
  });
  
  const handleValueChange = (param: keyof MixxBalanceSettings, value: number) => {
    setPluginState({ [param]: value });
    PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-balance', parameter: param, value });
    broadcast('parameter_change', { plugin: 'mixx-balance', parameter: param, value });
  };

  return (
    <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
      <div className="w-full h-full flex items-center justify-around gap-6 p-4">
        <div className="w-64 h-64 bg-black/20 rounded-full border border-cyan-400/20">
          <Vectorscope widthParam={width} phaseParam={phase} tiltParam={tilt} />
        </div>
        <div className="flex flex-col gap-4">
            <Knob label="Width" value={width} setValue={(v) => handleValueChange('width', v)} paramName="width" isLearning={isLearning('width')} onMidiLearn={onMidiLearn} />
            <Knob label="Phase" value={phase} setValue={(v) => handleValueChange('phase', v)} paramName="phase" isLearning={isLearning('phase')} onMidiLearn={onMidiLearn} />
            <Knob label="Tilt" value={tilt} setValue={(v) => handleValueChange('tilt', v)} paramName="tilt" isLearning={isLearning('tilt')} onMidiLearn={onMidiLearn} />
            <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
            <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
        </div>
      </div>
    </PluginContainer>
  );
};