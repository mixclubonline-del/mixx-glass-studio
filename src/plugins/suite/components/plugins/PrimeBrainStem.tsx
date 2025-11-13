
import React, { useMemo } from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { PrimeBrainStemSettings, PluginComponentProps } from '../../types';

const NeuralHub: React.FC = () => {
    const pathwayCount = 20;
    const pathways = useMemo(() => Array.from({ length: pathwayCount }).map((_, i) => ({
        id: i,
        rotation: Math.random() * 360,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 4,
    })), []);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Pathways */}
            {pathways.map(p => (
                <div key={p.id} className="absolute w-full h-px bg-gradient-to-l from-white/50 to-transparent" style={{ transform: `rotate(${p.rotation}deg)`}}>
                    <div className="absolute w-2 h-2 rounded-full bg-white/80" style={{
                        animation: `data-packet ${p.duration}s ${p.delay}s infinite linear`,
                        boxShadow: '0 0 5px white'
                    }}/>
                </div>
            ))}
            <style>{`
                @keyframes data-packet {
                    from { left: 100%; }
                    to { left: 45%; }
                }
            `}</style>
            
            {/* Core */}
            <div 
                className="absolute w-1/2 h-1/2 rounded-full bg-white/5" 
                style={{
                    animation: `pulse-node-dynamic 4s infinite ease-in-out`,
                    boxShadow: `0 0 20px 10px rgba(255,255,255,0.1), inset 0 0 10px rgba(255,255,255,0.2)`,
                }}
            />
            <div 
                className="absolute w-1/4 h-1/4 rounded-full bg-white/30"
                style={{
                    animation: `pulse-node-dynamic 2s infinite ease-in-out`,
                    boxShadow: `0 0 10px 5px rgba(255,255,255,0.2)`,
                }}
            />
        </div>
    );
};

export const PrimeBrainStem: React.FC<PluginComponentProps<PrimeBrainStemSettings>> = ({ 
    isDragging, isResizing, name, description
}) => {
    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-48 h-48">
                    <NeuralHub />
                </div>
                <p className="mt-8 text-white/70">Collecting all plugin states and emitting global mood packets.</p>
                <p className="text-sm text-white/50">This is a non-interactive system component.</p>
            </div>
        </PluginContainer>
    );
};
