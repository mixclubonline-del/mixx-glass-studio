import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrangeClip, ClipId } from '../hooks/useArrange';
import { XIcon } from './icons';
import { AuraColors, AuraEffects } from '../theme/aura-tokens';
import { hexToRgba } from '../utils/ALS';

interface PrimeBrainInterfaceProps {
  clip: ArrangeClip;
  onClose: () => void;
  onUpdateClip: (clipId: ClipId, props: Partial<ArrangeClip>) => void;
}

const WaveformPath: React.FC<{ color: string, stretchFactor: number }> = ({ color, stretchFactor }) => {
    // This is a static, stylized representation of a waveform for the UI.
    const d = "M0,50 C15,80 30,20 45,50 S75,80 90,50 C105,20 120,80 135,50 S165,20 180,50 C195,80 210,20 225,50 S255,80 270,50 S300,20 315,50 S345,80 360,50 S390,20 405,50";
    
    // Animate the viewBox to create a stretching effect
    const viewBoxWidth = 405 / stretchFactor;
    const viewBoxX = (405 - viewBoxWidth) / 2;

    return (
        <svg viewBox={`${viewBoxX} 0 ${viewBoxWidth} 100`} className="w-full h-full transition-all duration-100 ease-linear" preserveAspectRatio="none">
            <defs>
                <filter id="waveform-glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                 <linearGradient id="waveform-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6"/>
                    <stop offset="50%" stopColor={color} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={d} stroke={color} strokeWidth="2.5" fill="url(#waveform-gradient)" style={{ filter: 'url(#waveform-glow)'}} />
        </svg>
    );
};


const PrimeBrainInterface: React.FC<PrimeBrainInterfaceProps> = ({ clip, onClose, onUpdateClip }) => {
  const [isWarping, setIsWarping] = useState(false);
  const dragStartRef = useRef({ x: 0, rate: 1.0 });

  const handleTimeNodeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWarping(true);
    dragStartRef.current = {
      x: e.clientX,
      rate: clip.timeStretchRate ?? 1.0,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isWarping) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const sensitivity = 400; // Pixels for a 2x change (from 0.5 to 2.5)
    let newRate = dragStartRef.current.rate + (deltaX / sensitivity) * 2.0;
    
    // Clamp rate between 0.5x (slower) and 2.0x (faster)
    newRate = Math.max(0.5, Math.min(2.0, newRate));

    onUpdateClip(clip.id, { timeStretchRate: newRate });
  }, [isWarping, clip.id, onUpdateClip]);

  const handleMouseUp = useCallback(() => {
    setIsWarping(false);
  }, []);

  useEffect(() => {
    if (isWarping) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isWarping, handleMouseMove, handleMouseUp]);


  const timeStretchRate = clip.timeStretchRate ?? 1.0;
  
  const brainAccent = AuraColors.thermal.warm;
  const secondaryAccent = AuraColors.violet;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]" 
        style={{ backdropFilter: 'blur(16px)' }}
        onClick={onClose}>
        <div 
            className="relative w-[85vw] h-[75vh] max-w-6xl rounded-[32px] flex flex-col p-8 overflow-hidden" 
            style={{
                background: `linear-gradient(145deg, ${hexToRgba(AuraColors.space, 0.95)}, ${hexToRgba(AuraColors.twilight, 0.9)})`,
                border: `1px solid ${hexToRgba(brainAccent, 0.2)}`,
                boxShadow: `0 0 80px ${hexToRgba(brainAccent, 0.15)}, inset 0 0 20px ${hexToRgba(AuraColors.violet, 0.1)}`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Background Vortex Effect */}
            <div 
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${isWarping ? 'opacity-100' : 'opacity-30'}`} 
                style={{
                    background: `radial-gradient(ellipse at center, transparent 30%, ${hexToRgba(clip.color, isWarping ? 0.2 : 0.05)} 100%)`,
                    animation: isWarping ? 'time-warp-vortex 12s linear infinite' : 'none', // Faster when warping
                    pointerEvents: 'none'
                }}
            />

            <header className="flex justify-between items-start mb-6 z-10">
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-slate-400 mb-1">Intelligence Layer</h2>
                    <h1 className="text-3xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">PRIME BRAIN</h1>
                    <p className="text-sm mt-1 font-mono tracking-wider" style={{ color: brainAccent }}>
                        Analyzing: <span className="text-white ml-2">{clip.name}</span>
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </header>

            <div className="relative flex-grow flex items-center justify-center z-10">
                {/* Central Brain & Waveform */}
                <div className="absolute w-full h-64 pointer-events-none opacity-80">
                    <WaveformPath color={clip.color} stretchFactor={timeStretchRate} />
                </div>
                
                <div 
                    className="absolute w-44 h-44 rounded-full flex items-center justify-center" 
                    style={{ animation: 'brain-pulse 6s ease-in-out infinite' }}
                >
                    <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: hexToRgba(brainAccent, 0.15) }}></div>
                    <div 
                        className="w-32 h-32 rounded-full border-2 flex items-center justify-center backdrop-blur-md"
                        style={{
                            borderColor: hexToRgba(brainAccent, 0.6),
                            background: `radial-gradient(circle at 30% 30%, ${hexToRgba(brainAccent, 0.2)}, ${hexToRgba(AuraColors.space, 0.8)})`,
                            boxShadow: `0 0 30px ${hexToRgba(brainAccent, 0.2)}`
                        }}
                    >
                        <span className="text-[10px] font-bold tracking-[0.25em] text-white/90">BRAIN</span>
                    </div>
                </div>

                {/* Interactive Lattice Points */}
                <div className="absolute w-full h-full pointer-events-none">
                     {/* Pitch Node */}
                    <div className="absolute top-1/2 left-[calc(50%-240px)] -translate-y-1/2 flex flex-col items-center text-center pointer-events-auto cursor-pointer group">
                        <div 
                            className="w-18 h-18 rounded-full border flex items-center justify-center bg-black/40 transition-all duration-300 group-hover:scale-110" 
                            style={{ 
                                borderColor: hexToRgba(AuraColors.thermal.cold, 0.4),
                                animation: 'lattice-glow 5s ease-in-out infinite' 
                            }}
                        >
                             <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]"></div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4 group-hover:text-cyan-300 transition-colors">Pitch</span>
                    </div>

                     {/* Time Node (Center-Top) - Draggable */}
                     <div 
                        className="absolute top-[calc(50%-140px)] left-1/2 -translate-x-1/2 flex flex-col items-center text-center pointer-events-auto cursor-ew-resize group"
                        onMouseDown={handleTimeNodeMouseDown}
                     >
                        <div 
                            className={`w-24 h-24 rounded-full border flex flex-col items-center justify-center backdrop-blur-md transition-all duration-200 ${isWarping ? 'scale-110' : 'group-hover:scale-105'}`} 
                            style={{ 
                                borderColor: isWarping ? AuraColors.violet : hexToRgba(AuraColors.violet, 0.4),
                                background: isWarping ? hexToRgba(AuraColors.violet, 0.15) : 'rgba(0,0,0,0.4)',
                                boxShadow: isWarping ? `0 0 40px ${hexToRgba(AuraColors.violet, 0.4)}` : 'none',
                                animation: 'lattice-glow 5s 1.5s ease-in-out infinite' 
                            }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-1">Time</span>
                            <span className="text-xl font-mono text-white tracking-widest">{timeStretchRate >= 1.5 ? 'Fast' : timeStretchRate >= 1.1 ? 'Faster' : timeStretchRate >= 0.95 ? 'Normal' : timeStretchRate >= 0.7 ? 'Slower' : 'Slow'}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isWarping ? 'Warping...' : 'Drag to Warp'}
                        </span>
                    </div>

                     {/* Timbre Node */}
                     <div className="absolute top-1/2 right-[calc(50%-240px)] -translate-y-1/2 flex flex-col items-center text-center pointer-events-auto cursor-pointer group">
                        <div 
                            className="w-18 h-18 rounded-full border flex items-center justify-center bg-black/40 transition-all duration-300 group-hover:scale-110" 
                            style={{ 
                                borderColor: hexToRgba(secondaryAccent, 0.4),
                                animation: 'lattice-glow 5s 3s ease-in-out infinite' 
                            }}
                        >
                             <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_indigo]"></div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4 group-hover:text-indigo-300 transition-colors">Timbre</span>
                    </div>
                </div>
            </div>

            {/* Satellite Controls */}
            <footer className="grid grid-cols-3 gap-12 pt-8 border-t border-white/5 text-xs z-10 px-12">
                <div className="flex flex-col items-center gap-3">
                    <label htmlFor="focus-range" className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Focus</label>
                    <input 
                        id="focus-range" type="range" min="0" max="1" step="0.01" defaultValue="0.5" 
                        className="w-full h-1 appearance-none bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700" 
                        style={{ accentColor: AuraColors.thermal.cold }}
                    />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <label htmlFor="aggression-range" className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Aggression</label>
                    <input 
                        id="aggression-range" type="range" min="0" max="1" step="0.01" defaultValue="0.3" 
                        className="w-full h-1 appearance-none bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700" 
                        style={{ accentColor: AuraColors.thermal.hot }}
                    />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <label htmlFor="flow-range" className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Flow</label>
                    <input 
                        id="flow-range" type="range" min="0" max="1" step="0.01" defaultValue="0.8" 
                        className="w-full h-1 appearance-none bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700" 
                        style={{ accentColor: AuraColors.violet }}
                    />
                </div>
            </footer>
        </div>
    </div>
  );
};

export default PrimeBrainInterface;